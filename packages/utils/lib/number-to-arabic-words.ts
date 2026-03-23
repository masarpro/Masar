/**
 * تحويل الأرقام إلى كلمات عربية
 * يدعم أعداد حتى 999,999,999 مع "ريال سعودي" و "هللة"
 */

const ONES_MASCULINE = [
	"",
	"واحد",
	"اثنان",
	"ثلاثة",
	"أربعة",
	"خمسة",
	"ستة",
	"سبعة",
	"ثمانية",
	"تسعة",
];

const ONES_FEMININE = [
	"",
	"واحدة",
	"اثنتان",
	"ثلاث",
	"أربع",
	"خمس",
	"ست",
	"سبع",
	"ثمان",
	"تسع",
];

const TEENS = [
	"عشرة",
	"أحد عشر",
	"اثنا عشر",
	"ثلاثة عشر",
	"أربعة عشر",
	"خمسة عشر",
	"ستة عشر",
	"سبعة عشر",
	"ثمانية عشر",
	"تسعة عشر",
];

const TENS = [
	"",
	"",
	"عشرون",
	"ثلاثون",
	"أربعون",
	"خمسون",
	"ستون",
	"سبعون",
	"ثمانون",
	"تسعون",
];

const HUNDREDS = [
	"",
	"مائة",
	"مائتان",
	"ثلاثمائة",
	"أربعمائة",
	"خمسمائة",
	"ستمائة",
	"سبعمائة",
	"ثمانمائة",
	"تسعمائة",
];

function convertHundreds(num: number): string {
	if (num === 0) return "";

	const parts: string[] = [];

	const h = Math.floor(num / 100);
	const remainder = num % 100;

	if (h > 0) {
		parts.push(HUNDREDS[h]);
	}

	if (remainder === 0) {
		// nothing more
	} else if (remainder >= 10 && remainder <= 19) {
		parts.push(TEENS[remainder - 10]);
	} else {
		const t = Math.floor(remainder / 10);
		const o = remainder % 10;

		if (o > 0 && t > 1) {
			parts.push(`${ONES_MASCULINE[o]} و${TENS[t]}`);
		} else if (o > 0 && t === 0) {
			parts.push(ONES_MASCULINE[o]);
		} else if (o === 0 && t > 1) {
			parts.push(TENS[t]);
		}
	}

	return parts.join(" و");
}

/**
 * تحويل رقم إلى كلمات عربية مع العملة
 * @param amount - المبلغ (مثال: 13800.50)
 * @returns النص العربي (مثال: "ثلاثة عشر ألفاً وثمانمائة ريال سعودي وخمسون هللة")
 */
export function numberToArabicWords(amount: number): string {
	if (amount === 0) return "صفر ريال سعودي";
	if (amount < 0) return "سالب " + numberToArabicWords(Math.abs(amount));

	const intPart = Math.floor(amount);
	const decPart = Math.round((amount - intPart) * 100);

	const intWords = convertInteger(intPart);

	let result = intWords + " ريال سعودي";

	if (decPart > 0) {
		const decWords = convertInteger(decPart);
		result += ` و${decWords} هللة`;
	}

	return result;
}

function convertInteger(num: number): string {
	if (num === 0) return "صفر";
	if (num > 999999999) return num.toLocaleString("en-US");

	const parts: string[] = [];

	// Millions (1,000,000 - 999,999,999)
	const millions = Math.floor(num / 1000000);
	if (millions > 0) {
		if (millions === 1) {
			parts.push("مليون");
		} else if (millions === 2) {
			parts.push("مليونان");
		} else if (millions >= 3 && millions <= 10) {
			parts.push(`${ONES_FEMININE[millions]} ملايين`);
		} else {
			parts.push(`${convertHundreds(millions)} مليون`);
		}
	}

	// Thousands (1,000 - 999,999)
	const thousands = Math.floor((num % 1000000) / 1000);
	if (thousands > 0) {
		if (thousands === 1) {
			parts.push("ألف");
		} else if (thousands === 2) {
			parts.push("ألفان");
		} else if (thousands >= 3 && thousands <= 10) {
			parts.push(`${ONES_FEMININE[thousands]} آلاف`);
		} else {
			parts.push(`${convertHundreds(thousands)} ألفاً`);
		}
	}

	// Hundreds, tens, ones (0-999)
	const remainder = num % 1000;
	if (remainder > 0) {
		parts.push(convertHundreds(remainder));
	}

	return parts.join(" و");
}
