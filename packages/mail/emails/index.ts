import { EmailVerification } from "../emails/EmailVerification";
import { ForgotPassword } from "../emails/ForgotPassword";
import { MagicLink } from "../emails/MagicLink";
import { NewsletterSignup } from "../emails/NewsletterSignup";
import { NewUser } from "../emails/NewUser";
import { OrganizationInvitation } from "../emails/OrganizationInvitation";
import { UserInvitation } from "../emails/UserInvitation";

export const mailTemplates = {
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	newsletterSignup: NewsletterSignup,
	organizationInvitation: OrganizationInvitation,
	emailVerification: EmailVerification,
	userInvitation: UserInvitation,
} as const;
