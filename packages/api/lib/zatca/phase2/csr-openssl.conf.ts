/**
 * ZATCA CSR OpenSSL config template generator.
 * Produces a config file compatible with: openssl req -new -config <file>
 */

export interface CSRConfInput {
	organizationName: string;
	location: string;
	cn: string;
	templateName: string;
	uuid: string;
	vatNumber: string;
	invoiceType: string;
	industry: string;
}

export interface CSRConfInputV2 extends CSRConfInput {
	branchName: string;
	snPrefix: string;
}

export function generateOpenSSLConf(input: CSRConfInput | CSRConfInputV2): string {
	const branchName = (input as CSRConfInputV2).branchName ?? input.location;
	const snPrefix = (input as CSRConfInputV2).snPrefix ?? "1-TST|2-TST|3-";
	// Layout matches the ZATCA SDK / zatca-xml-js reference template:
	//   - prompt = no, utf8 = no  → ASCII-only fields, PrintableString encoding
	//   - DN order CN, OU, O, C   → matches the order ZATCA's parser expects
	//   - no basicConstraints     → ZATCA template comments it out
	//   - 1.3.6.1.4.1.311.20.2 as UTF8String (not PrintableString)
	return `[req]
prompt = no
utf8 = no
default_md = sha256
req_extensions = v3_req
distinguished_name = my_req_dn_prompt

[ v3_req ]
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:${input.templateName}
subjectAltName = dirName:dir_sect

[ dir_sect ]
SN = ${snPrefix}${input.uuid}
UID = ${input.vatNumber}
title = ${input.invoiceType}
registeredAddress = ${input.location}
businessCategory = ${input.industry}

[my_req_dn_prompt]
commonName = ${input.cn}
organizationalUnitName = ${branchName}
organizationName = ${input.organizationName}
countryName = SA
`;
}
