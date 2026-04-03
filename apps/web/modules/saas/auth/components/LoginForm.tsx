"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useAuthErrorMessages } from "@saas/auth/hooks/errors-messages";
import { sessionQueryKey } from "@saas/auth/lib/api";
import { OrganizationInvitationAlert } from "@saas/organizations/components/OrganizationInvitationAlert";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	MailIcon,
	MailboxIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { useSession } from "../hooks/use-session";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.union([
	z.object({
		mode: z.literal("magic-link"),
		email: z.string().email(),
	}),
	z.object({
		mode: z.literal("password"),
		email: z.string().email(),
		password: z.string().min(1),
	}),
]);

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			mode: config.auth.enablePasswordLogin ? "password" : "magic-link",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]);

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			if (values.mode === "password") {
				const { data, error } = await authClient.signIn.email({
					...values,
				});

				if (error) {
					throw error;
				}

				if ((data as any).twoFactorRedirect) {
					router.replace(
						withQuery(
							"/auth/verify",
							Object.fromEntries(searchParams.entries()),
						),
					);
					return;
				}

				queryClient.invalidateQueries({
					queryKey: sessionQueryKey,
				});

				router.replace(redirectPath);
			} else {
				const { error } = await authClient.signIn.magicLink({
					...values,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
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
	};

	const signinMode = form.watch("mode");

	return (
		<div>
			<h1 className="font-bold text-2xl md:text-3xl">
				{t("auth.login.title")}
			</h1>
			<p className="mt-2 mb-8 text-muted-foreground">
				{t("auth.login.subtitle")}
			</p>

			{form.formState.isSubmitSuccessful &&
			signinMode === "magic-link" ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.login.hints.linkSent.title")}
					</AlertTitle>
					<AlertDescription>
						{t("auth.login.hints.linkSent.message")}
					</AlertDescription>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="space-y-5"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root?.message && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertTitle>
											{form.formState.errors.root.message}
										</AlertTitle>
									</Alert>
								)}

							{signinMode === "magic-link" && (
								<p className="text-sm text-muted-foreground">
									{t("auth.login.emailLoginDescription")}
								</p>
							)}

							<FormField
								control={form.control}
								name="email"
								render={({ field }: any) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
												className="h-11"
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{config.auth.enablePasswordLogin &&
								signinMode === "password" && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }: any) => (
											<FormItem>
												<div className="flex justify-between gap-4">
													<FormLabel>
														{t(
															"auth.signup.password",
														)}
													</FormLabel>

													<Link
														href="/auth/forgot-password"
														className="text-muted-foreground text-xs hover:text-foreground transition-colors"
													>
														{t(
															"auth.login.forgotPassword",
														)}
													</Link>
												</div>
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
															autoComplete="current-password"
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
											</FormItem>
										)}
									/>
								)}

							<Button
								className="w-full h-11"
								type="submit"
								loading={form.formState.isSubmitting}
							>
								{signinMode === "magic-link"
									? t("auth.login.sendMagicLink")
									: t("auth.login.submit")}
							</Button>
						</form>
					</Form>

					{/* Magic Link toggle button */}
					{config.auth.enableMagicLink &&
						signinMode === "password" && (
							<Button
								type="button"
								variant="outline"
								className="w-full h-11 mt-3"
								onClick={() =>
									form.setValue(
										"mode",
										"magic-link" as const,
									)
								}
							>
								<MailIcon className="me-2 size-4" />
								{t("auth.login.emailLogin")}
							</Button>
						)}

					{/* Back to password mode */}
					{config.auth.enableMagicLink &&
						config.auth.enablePasswordLogin &&
						signinMode === "magic-link" &&
						!form.formState.isSubmitSuccessful && (
							<button
								type="button"
								className="w-full mt-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
								onClick={() =>
									form.setValue(
										"mode",
										"password" as const,
									)
								}
							>
								{t("auth.login.backToPassword")}
							</button>
						)}

					{/* Social login (Google only) */}
					{config.auth.enableSignup &&
						config.auth.enableSocialLogin && (
							<>
								<div className="relative my-6 h-4">
									<hr className="relative top-2" />
									<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-background px-2 text-center font-medium text-muted-foreground text-sm leading-tight">
										{t("auth.login.orContinueWith")}
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

					{config.auth.enableSignup && (
						<div className="mt-8 text-center text-sm">
							<span className="text-muted-foreground">
								{t("auth.login.dontHaveAnAccount")}{" "}
							</span>
							<Link
								href={withQuery(
									"/auth/signup",
									Object.fromEntries(
										searchParams.entries(),
									),
								)}
								className="font-medium text-primary hover:underline"
							>
								{t("auth.login.createAnAccount")}
								<ArrowRightIcon className="ms-1 inline size-4 align-middle rtl-flip" />
							</Link>
						</div>
					)}
				</>
			)}
		</div>
	);
}
