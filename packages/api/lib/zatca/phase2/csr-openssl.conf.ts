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

export function generateOpenSSLConf(input: CSRConfInput): string {
	return `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
C = SA
O = ${input.organizationName}
OU = ${input.location}
CN = ${input.cn}

[v3_req]
basicConstraints = CA:FALSE
subjectAltName = dirName:alt_names
1.3.6.1.4.1.311.20.2 = ASN1:PRINTABLESTRING:${input.templateName}

[alt_names]
SN = 1-TST|2-TST|3-${input.uuid}
UID = ${input.vatNumber}
title = ${input.invoiceType}
registeredAddress = ${input.location}
businessCategory = ${input.industry}
`;
}
