export const WIZARD_STEPS = [
	{
		id: "welcome",
		labelKey: "onboarding.wizard.welcome.title",
		required: true,
	},
	{
		id: "companyInfo",
		labelKey: "onboarding.wizard.companyInfo.title",
		required: true,
	},
	{
		id: "template",
		labelKey: "onboarding.wizard.template.title",
		required: true,
	},
	{
		id: "firstProject",
		labelKey: "onboarding.wizard.firstProject.title",
		required: true,
	},
	{
		id: "inviteTeam",
		labelKey: "onboarding.wizard.inviteTeam.title",
		required: false,
	},
	{
		id: "completion",
		labelKey: "onboarding.wizard.completion.title",
		required: true,
	},
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export const SAUDI_CITIES = [
	"الرياض",
	"جدة",
	"مكة المكرمة",
	"المدينة المنورة",
	"الدمام",
	"الخبر",
	"الظهران",
	"الأحساء",
	"الطائف",
	"تبوك",
	"بريدة",
	"خميس مشيط",
	"حائل",
	"نجران",
	"جازان",
	"ينبع",
	"أبها",
	"الجبيل",
	"عرعر",
	"سكاكا",
] as const;

export const CONTRACTOR_CLASSES = [
	"أولى",
	"ثانية",
	"ثالثة",
	"رابعة",
	"خامسة",
	"غير مصنف",
] as const;
