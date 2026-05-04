/**
 * READ-ONLY ZATCA CSR Reference Diff
 *
 * Generates two CSRs from the same private key + same logical inputs:
 *   1. REFERENCE: rendered with the upstream zatca-xml-js template,
 *      signed by the openssl CLI ("openssl req -new -sha256 -key ... -config ...").
 *   2. OURS:     produced by re-running the manual DER builder logic
 *      copied verbatim from packages/api/lib/zatca/phase2/csr-generator.ts.
 *
 * Same key → SubjectPublicKeyInfo bytes must match. Signature bytes will
 * differ (random k in ECDSA), and that's expected. Everything else (Subject DN,
 * extensions, attributes ordering, encodings) MUST match byte-for-byte.
 *
 * Run (Windows PowerShell):
 *   $env:PATH += ';C:\Program Files\Git\mingw64\bin'
 *   pnpm tsx scripts/zatca/generate-reference-csr.ts
 *
 * NOTE: This script does NOT modify csr-generator.ts. Logic is duplicated
 *       inline so we can inject an external key without touching production.
 */

import { execSync } from "node:child_process";
import {
	createPrivateKey,
	createPublicKey,
	createSign,
	type KeyObject,
} from "node:crypto";
import {
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import asn1 from "asn1.js";

// ─── Constants matching the failed onboarding inputs ────────────────────

const TEST_INPUT = {
	vatNumber: "311181325200003",
	organizationName: "Masar Platform", // already-stripped ASCII fallback
	location: "Jeddah",
	industry: "Construction",
	invoiceType: "1100",
	uuid: "00000000-0000-0000-0000-000000000001",
	cn: "MASAR-EGS-311181325200003",
	templateName: "ZATCA-Code-Signing", // production
	snPrefix: "1-Masar|2-EGS1|3-",
	branchName: "Jeddah",
};

const SEP = "═".repeat(72);
const SUB = "─".repeat(72);

// ─── 0. Verify OpenSSL ──────────────────────────────────────────────────

let opensslVersion = "";
try {
	opensslVersion = execSync("openssl version", { encoding: "utf8" }).trim();
} catch {
	console.error("❌ OpenSSL not found in PATH.");
	console.error('   Try: $env:PATH += ";C:\\Program Files\\Git\\mingw64\\bin"');
	process.exit(1);
}
if (!opensslVersion.includes("OpenSSL")) {
	console.error("❌ Not OpenSSL:", opensslVersion);
	process.exit(1);
}

console.log(SEP);
console.log("  ZATCA CSR REFERENCE DIFF (READ-ONLY)");
console.log(`  ${opensslVersion}`);
console.log(`  Date: ${new Date().toISOString()}`);
console.log(SEP);
console.log();

// ─── 1. Generate one secp256k1 key, used by BOTH paths ─────────────────

const tmp = mkdtempSync(join(tmpdir(), "zatca-diff-"));
const sec1KeyFile = join(tmp, "key.sec1.pem");
const pkcs8KeyFile = join(tmp, "key.pkcs8.pem");
const refConfFile = join(tmp, "ref.conf");
const refCsrFile = join(tmp, "ref.csr");

execSync(`openssl ecparam -name secp256k1 -genkey -noout -out "${sec1KeyFile}"`, {
	stdio: "pipe",
});
execSync(`openssl pkcs8 -topk8 -nocrypt -in "${sec1KeyFile}" -out "${pkcs8KeyFile}"`, {
	stdio: "pipe",
});

const sec1Pem = readFileSync(sec1KeyFile, "utf8");
const pkcs8Pem = readFileSync(pkcs8KeyFile, "utf8");
const privateKey = createPrivateKey(pkcs8Pem);
const publicKey = createPublicKey(privateKey);
const publicKeySpkiDer = publicKey.export({ type: "spki", format: "der" }) as Buffer;

console.log("[Setup] Generated secp256k1 key pair");
console.log("        SPKI bytes:", publicKeySpkiDer.length);
console.log();

// ─── 2. REFERENCE CSR: render zatca-xml-js template + run openssl req ──

const refTemplate = `
# ------------------------------------------------------------------
# Default section for "req" command options
# ------------------------------------------------------------------
[req]

# Password for reading in existing private key file
# input_password = SET_PRIVATE_KEY_PASS

# Prompt for DN field values and CSR attributes in ASCII
prompt = no
utf8 = no

# Section pointer for DN field options
distinguished_name = my_req_dn_prompt

# Extensions
req_extensions = v3_req

[ v3_req ]
#basicConstraints=CA:FALSE
#keyUsage = digitalSignature, keyEncipherment
# Production or Testing Template (TSTZATCA-Code-Signing - ZATCA-Code-Signing)
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:${TEST_INPUT.templateName}
subjectAltName=dirName:dir_sect

[ dir_sect ]
# EGS Serial number (1-SolutionName|2-ModelOrVersion|3-serialNumber)
SN = ${TEST_INPUT.snPrefix}${TEST_INPUT.uuid}
# VAT Registration number of TaxPayer (Organization identifier [15 digits begins with 3 and ends with 3])
UID = ${TEST_INPUT.vatNumber}
# Invoice type (TSCZ)(1 = supported, 0 not supported) (Tax, Simplified, future use, future use)
title = ${TEST_INPUT.invoiceType}
# Location (branch address or website)
registeredAddress = ${TEST_INPUT.location}
# Industry (industry sector name)
businessCategory = ${TEST_INPUT.industry}

# ------------------------------------------------------------------
# Section for prompting DN field values to create "subject"
# ------------------------------------------------------------------
[my_req_dn_prompt]
# Common name (EGS TaxPayer PROVIDED ID [FREE TEXT])
commonName = ${TEST_INPUT.cn}

# Organization Unit (Branch name)
organizationalUnitName = ${TEST_INPUT.branchName}

# Organization name (Tax payer name)
organizationName = ${TEST_INPUT.organizationName}

# ISO2 country code is required with US as default
countryName = SA
`;
writeFileSync(refConfFile, refTemplate);

execSync(
	`openssl req -new -sha256 -key "${pkcs8KeyFile}" -config "${refConfFile}" -out "${refCsrFile}"`,
	{ stdio: "pipe" },
);
const refCsrPem = readFileSync(refCsrFile, "utf8");
const refDer = pemToDer(refCsrPem);
console.log("[REF] CSR built via openssl CLI — DER bytes:", refDer.length);
console.log();

// ─── 3. OURS CSR: replicate csr-generator.ts logic with same key ──────

// (logic copied verbatim from packages/api/lib/zatca/phase2/csr-generator.ts
//  — DO NOT edit production, this is local re-implementation only)

function derLength(len: number): Buffer {
	if (len < 0x80) return Buffer.from([len]);
	if (len < 0x100) return Buffer.from([0x81, len]);
	return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}
function derWrap(tag: number, content: Buffer): Buffer {
	return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}
const derSequence = (...items: Buffer[]) => derWrap(0x30, Buffer.concat(items));
const derSet = (...items: Buffer[]) => derWrap(0x31, Buffer.concat(items));
const derOctetString = (data: Buffer) => derWrap(0x04, data);
const derUTF8String = (str: string) => derWrap(0x0c, Buffer.from(str, "utf8"));
const derPrintableString = (str: string) =>
	derWrap(0x13, Buffer.from(str, "ascii"));
function derBitString(data: Buffer, unusedBits = 0): Buffer {
	return derWrap(
		0x03,
		Buffer.concat([Buffer.from([unusedBits]), data]),
	);
}
function derInteger(value: number): Buffer {
	if (value === 0) return derWrap(0x02, Buffer.from([0]));
	const bytes: number[] = [];
	let v = value;
	while (v > 0) {
		bytes.unshift(v & 0xff);
		v >>= 8;
	}
	if (bytes[0]! & 0x80) bytes.unshift(0);
	return derWrap(0x02, Buffer.from(bytes));
}
function derOID(oid: string): Buffer {
	const parts = oid.split(".").map(Number);
	const bytes: number[] = [40 * parts[0]! + parts[1]!];
	for (let i = 2; i < parts.length; i++) {
		let val = parts[i]!;
		if (val < 128) {
			bytes.push(val);
		} else {
			const temp: number[] = [];
			temp.unshift(val & 0x7f);
			val >>= 7;
			while (val > 0) {
				temp.unshift((val & 0x7f) | 0x80);
				val >>= 7;
			}
			bytes.push(...temp);
		}
	}
	return derWrap(0x06, Buffer.from(bytes));
}
function derContextTag(tag: number, content: Buffer): Buffer {
	return Buffer.concat([
		Buffer.from([0xa0 | tag]),
		derLength(content.length),
		content,
	]);
}
function derRDN(oid: string, value: Buffer): Buffer {
	return derSet(derSequence(derOID(oid), value));
}

const OID = {
	countryName: "2.5.4.6",
	organization: "2.5.4.10",
	organizationUnit: "2.5.4.11",
	commonName: "2.5.4.3",
	serialNumber: "2.5.4.5",
	userId: "0.9.2342.19200300.100.1.1",
	title: "2.5.4.12",
	registeredAddress: "2.5.4.26",
	businessCategory: "2.5.4.15",
	ecdsaWithSHA256: "1.2.840.10045.4.3.2",
	extensionRequest: "1.2.840.113549.1.9.14",
	certificateTemplateName: "1.3.6.1.4.1.311.20.2",
	subjectAltName: "2.5.29.17",
} as const;

function buildOurCsr(spkiDer: Buffer, key: KeyObject): Buffer {
	// Mirrors the post-fix logic in csr-generator.ts (UTF8String for free-text
	// RDNs, PrintableString for countryName, surname OID for SAN SN).
	const subject = derSequence(
		derRDN(OID.commonName, derUTF8String(TEST_INPUT.cn)),
		derRDN(OID.organizationUnit, derUTF8String(TEST_INPUT.branchName)),
		derRDN(OID.organization, derUTF8String(TEST_INPUT.organizationName)),
		derRDN(OID.countryName, derPrintableString("SA")),
	);

	const SAN_SN_OID = "2.5.4.4"; // surname — matches OpenSSL SN shortname
	const altNameDirName = derSequence(
		derRDN(
			SAN_SN_OID,
			derUTF8String(`${TEST_INPUT.snPrefix}${TEST_INPUT.uuid}`),
		),
		derRDN(OID.userId, derUTF8String(TEST_INPUT.vatNumber)),
		derRDN(OID.title, derUTF8String(TEST_INPUT.invoiceType)),
		derRDN(OID.registeredAddress, derUTF8String(TEST_INPUT.location)),
		derRDN(OID.businessCategory, derUTF8String(TEST_INPUT.industry)),
	);

	const subjectAltNameExt = derSequence(
		derOID(OID.subjectAltName),
		derOctetString(derSequence(derContextTag(4, altNameDirName))),
	);

	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derUTF8String(TEST_INPUT.templateName)),
	);

	const attributes = derContextTag(
		0,
		derSequence(
			derOID(OID.extensionRequest),
			derSet(derSequence(certTemplateExt, subjectAltNameExt)),
		),
	);

	const certRequestInfo = derSequence(
		derInteger(0),
		subject,
		spkiDer,
		attributes,
	);

	const signer = createSign("SHA256");
	signer.update(certRequestInfo);
	const signatureDer = signer.sign({ key, dsaEncoding: "der" });

	return derSequence(
		certRequestInfo,
		derSequence(derOID(OID.ecdsaWithSHA256)),
		derBitString(signatureDer),
	);
}

const ourDer = buildOurCsr(publicKeySpkiDer, privateKey);
console.log("[OURS] CSR built via Node.js DER builder — DER bytes:", ourDer.length);
console.log();

// ─── 4. ASN.1 structural decode + diff ─────────────────────────────────

const PrintableOrUTF8 = (function () {
	// asn1.js doesn't expose a CHOICE between PrintableString/UTF8String for
	// generic string content, so we use ANY and decode manually.
	return asn1.define("PrintableOrUTF8", function (this: any) {
		this.any();
	});
})();

const RelativeDistinguishedName = asn1.define("RDN", function (this: any) {
	this.setof(
		asn1.define("AttributeTypeAndValue", function (this: any) {
			this.seq().obj(this.key("type").objid(), this.key("value").any());
		}),
	);
});
const Name = asn1.define("Name", function (this: any) {
	this.seqof(RelativeDistinguishedName);
});

const AlgorithmIdentifier = asn1.define("AlgorithmIdentifier", function (this: any) {
	this.seq().obj(this.key("algorithm").objid(), this.key("parameters").optional().any());
});

const SubjectPublicKeyInfo = asn1.define("SubjectPublicKeyInfo", function (this: any) {
	this.seq().obj(
		this.key("algorithm").use(AlgorithmIdentifier),
		this.key("subjectPublicKey").bitstr(),
	);
});

const Extension = asn1.define("Extension", function (this: any) {
	this.seq().obj(
		this.key("extnID").objid(),
		this.key("critical").bool().def(false),
		this.key("extnValue").octstr(),
	);
});

const AnyValue = asn1.define("AnyValue", function (this: any) {
	this.any();
});

const Attribute = asn1.define("Attribute", function (this: any) {
	this.seq().obj(
		this.key("type").objid(),
		this.key("values").setof(AnyValue),
	);
});

// PKCS#10 attributes are [0] IMPLICIT SET OF Attribute. asn1.js's combination
// of implicit().setof() proved unreliable here, so capture the raw [0] body
// and decode the inner attributes manually below.
const CertificationRequestInfo = asn1.define(
	"CertificationRequestInfo",
	function (this: any) {
		this.seq().obj(
			this.key("version").int(),
			this.key("subject").use(Name),
			this.key("subjectPKInfo").use(SubjectPublicKeyInfo),
			this.key("attributesRaw").implicit(0).any(),
		);
	},
);

const CertificationRequest = asn1.define(
	"CertificationRequest",
	function (this: any) {
		this.seq().obj(
			this.key("certificationRequestInfo").use(CertificationRequestInfo),
			this.key("signatureAlgorithm").use(AlgorithmIdentifier),
			this.key("signature").bitstr(),
		);
	},
);

const refDecoded = CertificationRequest.decode(refDer, "der");
const ourDecoded = CertificationRequest.decode(ourDer, "der");

function fmtBuffer(b: Buffer | undefined, max = 64): string {
	if (!b) return "(undefined)";
	const hex = b.toString("hex");
	return hex.length > max ? hex.slice(0, max) + "…" : hex;
}

function decodeRdnValue(rawTLV: Buffer): { tag: number; tagName: string; value: string } {
	const tag = rawTLV[0]!;
	const lenByte = rawTLV[1]!;
	let lenStart = 2;
	let length = lenByte;
	if (lenByte & 0x80) {
		const bytes = lenByte & 0x7f;
		length = 0;
		for (let i = 0; i < bytes; i++) {
			length = (length << 8) | rawTLV[2 + i]!;
		}
		lenStart = 2 + bytes;
	}
	const content = rawTLV.subarray(lenStart, lenStart + length);
	const tagName =
		tag === 0x13 ? "PrintableString" :
		tag === 0x0c ? "UTF8String" :
		tag === 0x14 ? "T61String" :
		tag === 0x16 ? "IA5String" :
		tag === 0x1e ? "BMPString" :
		`unknown(0x${tag.toString(16)})`;
	return { tag, tagName, value: content.toString("utf8") };
}

const oidNames: Record<string, string> = {
	"2.5.4.3": "CN",
	"2.5.4.6": "C",
	"2.5.4.10": "O",
	"2.5.4.11": "OU",
	"2.5.4.5": "SN (serialNumber)",
	"2.5.4.12": "title",
	"2.5.4.15": "businessCategory",
	"2.5.4.26": "registeredAddress",
	"0.9.2342.19200300.100.1.1": "UID",
	"2.5.29.17": "subjectAltName",
	"1.3.6.1.4.1.311.20.2": "certificateTemplateName",
	"1.2.840.113549.1.9.14": "extensionRequest",
	"1.2.840.10045.2.1": "ecPublicKey",
	"1.3.132.0.10": "secp256k1",
	"1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
};
const oidName = (oid: string) => oidNames[oid] ?? oid;

function pemToDer(pem: string): Buffer {
	const body = pem
		.replace(/-----BEGIN[^-]+-----/g, "")
		.replace(/-----END[^-]+-----/g, "")
		.replace(/\s+/g, "");
	return Buffer.from(body, "base64");
}

function joinOid(o: any): string {
	if (Array.isArray(o)) return o.join(".");
	if (typeof o?.join === "function") return o.join(".");
	return String(o);
}

console.log(SEP);
console.log("  CSR DIFF: Ours (Node.js crypto) vs Reference (OpenSSL CLI)");
console.log("  Same private key, same logical inputs");
console.log(SEP);
console.log();

console.log("[1] Total DER length");
console.log(SUB);
console.log(`  Ours:      ${ourDer.length} bytes`);
console.log(`  Reference: ${refDer.length} bytes`);
console.log(`  Match:     ${ourDer.length === refDer.length ? "✓" : "✗"}`);
console.log();

// [2] Subject DN
console.log("[2] Subject DN");
console.log(SUB);
const refSubject = refDecoded.certificationRequestInfo.subject;
const ourSubject = ourDecoded.certificationRequestInfo.subject;
console.log(`  RDN count: Ours=${ourSubject.length}, Ref=${refSubject.length}, Match=${ourSubject.length === refSubject.length ? "✓" : "✗"}`);
const maxRdns = Math.max(ourSubject.length, refSubject.length);
for (let i = 0; i < maxRdns; i++) {
	const ourRdn = ourSubject[i]?.[0];
	const refRdn = refSubject[i]?.[0];
	const ourOid = ourRdn ? joinOid(ourRdn.type) : "(missing)";
	const refOid = refRdn ? joinOid(refRdn.type) : "(missing)";
	const ourVal = ourRdn ? decodeRdnValue(ourRdn.value) : null;
	const refVal = refRdn ? decodeRdnValue(refRdn.value) : null;
	const oidMatch = ourOid === refOid;
	const tagMatch = ourVal && refVal ? ourVal.tag === refVal.tag : false;
	const valMatch = ourVal && refVal ? ourVal.value === refVal.value : false;
	console.log(`  RDN[${i}]:`);
	console.log(`    OID:     Ours=${ourOid} (${oidName(ourOid)})  Ref=${refOid} (${oidName(refOid)})  ${oidMatch ? "✓" : "✗"}`);
	console.log(`    Tag:     Ours=0x${(ourVal?.tag ?? 0).toString(16).padStart(2, "0")} (${ourVal?.tagName})  Ref=0x${(refVal?.tag ?? 0).toString(16).padStart(2, "0")} (${refVal?.tagName})  ${tagMatch ? "✓" : "✗"}`);
	console.log(`    Value:   Ours="${ourVal?.value}"  Ref="${refVal?.value}"  ${valMatch ? "✓" : "✗"}`);
}
console.log();

// [3] Public key info
console.log("[3] subjectPublicKeyInfo");
console.log(SUB);
const refPK = refDecoded.certificationRequestInfo.subjectPKInfo;
const ourPK = ourDecoded.certificationRequestInfo.subjectPKInfo;
const refAlgOid = joinOid(refPK.algorithm.algorithm);
const ourAlgOid = joinOid(ourPK.algorithm.algorithm);
console.log(`  algorithm OID:    Ours=${ourAlgOid} (${oidName(ourAlgOid)})  Ref=${refAlgOid} (${oidName(refAlgOid)})  ${refAlgOid === ourAlgOid ? "✓" : "✗"}`);
const refParams = refPK.algorithm.parameters as Buffer | undefined;
const ourParams = ourPK.algorithm.parameters as Buffer | undefined;
console.log(`  parameters:       Ours=${fmtBuffer(ourParams)}  Ref=${fmtBuffer(refParams)}`);
console.log(`  parameters match: ${refParams && ourParams && refParams.equals(ourParams) ? "✓" : "✗"}`);
const refPubKey = refPK.subjectPublicKey.data as Buffer;
const ourPubKey = ourPK.subjectPublicKey.data as Buffer;
console.log(`  publicKey first 16 bytes: Ours=${fmtBuffer(ourPubKey.subarray(0, 16))}  Ref=${fmtBuffer(refPubKey.subarray(0, 16))}`);
console.log(`  publicKey full match (must match — same key): ${refPubKey.equals(ourPubKey) ? "✓" : "✗"}`);
console.log();

// [4] Attributes / extensions
console.log("[4] Attributes (extensionRequest)");
console.log(SUB);
// attributesRaw is the [0]-stripped CONTENT of the implicit set, which is
// "SET OF Attribute" without the SET tag — i.e. concatenated Attribute bytes.
function parseAttributes(rawSetContent: Buffer): any[] {
	const out: any[] = [];
	let off = 0;
	while (off < rawSetContent.length) {
		const tag = rawSetContent[off]!;
		// Each Attribute is a SEQUENCE — read TLV
		if (tag !== 0x30) break;
		let lenByte = rawSetContent[off + 1]!;
		let lenStart = off + 2;
		let length = lenByte;
		if (lenByte & 0x80) {
			const n = lenByte & 0x7f;
			length = 0;
			for (let i = 0; i < n; i++) length = (length << 8) | rawSetContent[off + 2 + i]!;
			lenStart = off + 2 + n;
		}
		const tlv = rawSetContent.subarray(off, lenStart + length);
		try {
			out.push(Attribute.decode(tlv, "der"));
		} catch (err) {
			out.push({ _decodeError: (err as Error).message, raw: tlv });
		}
		off = lenStart + length;
	}
	return out;
}
const refAttrsRaw = refDecoded.certificationRequestInfo.attributesRaw as Buffer;
const ourAttrsRaw = ourDecoded.certificationRequestInfo.attributesRaw as Buffer;
const refAttrs = parseAttributes(refAttrsRaw);
const ourAttrs = parseAttributes(ourAttrsRaw);
console.log(`  Attribute count: Ours=${ourAttrs.length}, Ref=${refAttrs.length}, Match=${ourAttrs.length === refAttrs.length ? "✓" : "✗"}`);
console.log(`  Raw [0] length:  Ours=${ourAttrsRaw.length}, Ref=${refAttrsRaw.length}`);

function parseExtensionList(valBytes: Buffer): any[] {
	const ExtList = asn1.define("ExtList", function (this: any) {
		this.seqof(Extension);
	});
	return ExtList.decode(valBytes, "der");
}

function dumpAttribute(label: string, attr: any) {
	if (attr._decodeError) {
		console.log(`  ${label}: (decode error) ${attr._decodeError}`);
		console.log(`    raw hex: ${(attr.raw as Buffer).toString("hex")}`);
		return;
	}
	const oid = joinOid(attr.type);
	console.log(`  ${label}:`);
	console.log(`    type: ${oid} (${oidName(oid)})`);
	console.log(`    values count: ${attr.values.length}`);
	for (let v = 0; v < attr.values.length; v++) {
		const valBytes = attr.values[v] as Buffer;
		try {
			const exts = parseExtensionList(valBytes);
			console.log(`    extensions: ${exts.length}`);
			for (let e = 0; e < exts.length; e++) {
				const ext = exts[e];
				const eoid = joinOid(ext.extnID);
				const extValHex = ext.extnValue.toString("hex");
				console.log(`      [${e}] ${eoid} (${oidName(eoid)}) critical=${ext.critical} valueLen=${ext.extnValue.length} valueHex=${extValHex.length > 80 ? extValHex.slice(0, 80) + "…" : extValHex}`);
			}
		} catch (err) {
			console.log(`    (could not decode extensions: ${(err as Error).message})`);
			console.log(`    raw value hex: ${valBytes.toString("hex")}`);
		}
	}
}
if (ourAttrs.length) dumpAttribute("Ours[0]", ourAttrs[0]);
if (refAttrs.length) dumpAttribute("Ref[0]", refAttrs[0]);
console.log();

// [5] Signature algorithm
console.log("[5] signatureAlgorithm");
console.log(SUB);
const refSigOid = joinOid(refDecoded.signatureAlgorithm.algorithm);
const ourSigOid = joinOid(ourDecoded.signatureAlgorithm.algorithm);
console.log(`  Ours: ${ourSigOid} (${oidName(ourSigOid)})`);
console.log(`  Ref:  ${refSigOid} (${oidName(refSigOid)})`);
console.log(`  Match: ${ourSigOid === refSigOid ? "✓" : "✗"}`);
const refSigParams = refDecoded.signatureAlgorithm.parameters as Buffer | undefined;
const ourSigParams = ourDecoded.signatureAlgorithm.parameters as Buffer | undefined;
console.log(`  Parameters present: Ours=${ourSigParams !== undefined} Ref=${refSigParams !== undefined}`);
console.log();

// [6] First differing byte (excluding signature)
console.log("[6] First differing byte");
console.log(SUB);
// Compare only the certificationRequestInfo portion (signature differs by design)
const refCriDer = CertificationRequestInfo.encode(refDecoded.certificationRequestInfo, "der");
const ourCriDer = CertificationRequestInfo.encode(ourDecoded.certificationRequestInfo, "der");
console.log(`  Ours certRequestInfo bytes: ${ourCriDer.length}`);
console.log(`  Ref  certRequestInfo bytes: ${refCriDer.length}`);
let diffOffset = -1;
const minLen = Math.min(refCriDer.length, ourCriDer.length);
for (let i = 0; i < minLen; i++) {
	if (refCriDer[i] !== ourCriDer[i]) {
		diffOffset = i;
		break;
	}
}
if (diffOffset === -1 && refCriDer.length === ourCriDer.length) {
	console.log("  ✓ certRequestInfo bytes are IDENTICAL");
} else if (diffOffset === -1) {
	console.log(`  Length differs but no byte differs in shared prefix; ours len=${ourCriDer.length} ref len=${refCriDer.length}`);
} else {
	console.log(`  ✗ First diff at byte offset 0x${diffOffset.toString(16)} (${diffOffset} dec)`);
	const win = (b: Buffer, c: number, w = 12) => {
		const start = Math.max(0, c - 4);
		const end = Math.min(b.length, c + w);
		return b.subarray(start, end).toString("hex").match(/../g)!.map((bb, i) => (start + i === c ? `[${bb}]` : bb)).join(" ");
	};
	console.log(`    Ours: …${win(ourCriDer, diffOffset)}`);
	console.log(`    Ref:  …${win(refCriDer, diffOffset)}`);
}
console.log();

// [7] Hex dumps
function hexDump(label: string, buf: Buffer) {
	console.log(`${label} (${buf.length} bytes)`);
	for (let i = 0; i < buf.length; i += 32) {
		const chunk = buf.subarray(i, i + 32);
		console.log(
			`  ${i.toString(16).padStart(4, "0")}: ${Array.from(chunk).map((b) => b.toString(16).padStart(2, "0")).join(" ")}`,
		);
	}
}
console.log(SEP);
console.log("  HEX DUMPS (full DER)");
console.log(SEP);
hexDump("OURS DER", ourDer);
console.log();
hexDump("REFERENCE DER", refDer);
console.log();

console.log(SEP);
console.log(`  Done. Temp dir kept for inspection: ${tmp}`);
console.log(`  (private key + CSRs there — DELETE after diagnosis)`);
console.log(SEP);
