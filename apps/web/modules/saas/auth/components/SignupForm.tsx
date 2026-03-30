"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useAuthErrorMessages } from "@saas/auth/hooks/errors-messages";
import { OrganizationInvitationAlert } from "@saas/organizations/components/OrganizationInvitationAlert";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	MailboxIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1),
	password: z.string(),
});

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
	const t = useTranslations();
	const router = useRouter();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		values: {
			name: "",
			email: prefillEmail ?? email ?? "",
			password: "",
		},
	});

	const invitationOnlyMode = !config.auth.enableSignup && invitationId;

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	const onSubmit = form.handleSubmit(async ({ email, password, name }) => {
		try {
			const { error } = await (config.auth.enablePasswordLogin
				? await authClient.signUp.email({
						email,
						password,
						name,
						callbackURL: redirectPath,
					})
				: authClient.signIn.magicLink({
						email,
						name,
						callbackURL: redirectPath,
					}));

			if (error) {
				throw error;
			}

			if (invitationOnlyMode) {
				const { error } =
					await authClient.organization.acceptInvitation({
						invitationId,
					});

				if (error) {
					throw error;
				}

				router.push(config.auth.redirectAfterSignIn);
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	});

	return (
		<div>
			<h1 className="font-bold text-2xl md:text-3xl">
				{t("auth.signup.title")}
			</h1>
			<p className="mt-2 mb-8 text-muted-foreground">
				{t("auth.signup.message")}
			</p>

			{form.formState.isSubmitSuccessful && !invitationOnlyMode ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.signup.hints.verifyEmail")}
					</AlertTitle>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="flex flex-col items-stretch gap-5"
							onSubmit={onSubmit}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertDescription>
											{form.formState.errors.root.message}
										</AlertDescription>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.name")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												className="h-11"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
												readOnly={!!prefillEmail}
												className="h-11"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{config.auth.enablePasswordLogin && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("auth.signup.password")}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														type={
															showPassword
																? "text"
																: "password"
														}
														className="h-11 pe-10"
														{...field}
														autoComplete="new-password"
													/>
													<button
														type="button"
														onClick={() =>
															setShowPassword(
																!showPassword,
															)
														}
														className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
													>
														{showPassword ? (
															<EyeOffIcon className="size-4" />
														) : (
															<EyeIcon className="size-4" />
														)}
													</button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<Button
								className="h-11"
								loading={form.formState.isSubmitting}
							>
								{t("auth.signup.submit")}
							</Button>
						</form>
					</Form>

					{/* Social login (Google only) */}
					{config.auth.enableSignup &&
						config.auth.enableSocialLogin && (
							<>
								<div className="relative my-6 h-4">
									<hr className="relative top-2" />
									<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-background px-2 text-center font-medium text-muted-foreground text-sm leading-tight">
										{t("auth.signup.orContinueWith")}
									</p>
								</div>

								<div className="grid grid-cols-1 gap-2">
									<SocialSigninButton
										provider="google"
										className="h-11"
									/>
								</div>
							</>
						)}
				</>
			)}

			<div className="mt-8 text-center text-sm">
				<span className="text-muted-foreground">
					{t("auth.signup.alreadyHaveAccount")}{" "}
				</span>
				<Link
					href={withQuery(
						"/auth/login",
						Object.fromEntries(searchParams.entries()),
					)}
					className="font-medium text-primary hover:underline"
				>
					{t("auth.signup.signIn")}
					<ArrowRightIcon className="ms-1 inline size-4 align-middle rtl-flip" />
				</Link>
			</div>
		</div>
	);
}
