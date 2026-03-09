import { withContentCollections } from "@content-collections/next";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
	experimental: {
		optimizePackageImports: [
			"lucide-react",
			"recharts",
			"date-fns",
			"es-toolkit",
			"@radix-ui/react-icons",
		],
	},
	transpilePackages: ["@repo/api", "@repo/auth", "@repo/database"],
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				// placeholder images
				protocol: "https",
				hostname: "picsum.photos",
			},
			{
				// AWS S3 - project photos (bucket.s3.region.amazonaws.com)
				protocol: "https",
				hostname: "s3.amazonaws.com",
				pathname: "/**",
			},
			{
				// Supabase Storage - document files
				protocol: "https",
				hostname: "mbivfenbnvkquxajwbju.storage.supabase.co",
				pathname: "/**",
			},
			{
				// localhost for development
				protocol: "http",
				hostname: "localhost",
				pathname: "/**",
			},
		],
	},
	async headers() {
		const securityHeaders = [
			{
				key: "X-Content-Type-Options",
				value: "nosniff",
			},
			{
				key: "Referrer-Policy",
				value: "strict-origin-when-cross-origin",
			},
			{
				key: "Permissions-Policy",
				value: "camera=(), microphone=(), geolocation=()",
			},
			{
				// HSTS — enforce HTTPS for all routes. No preload yet until
				// domain is verified on hstspreload.org.
				key: "Strict-Transport-Security",
				value: "max-age=31536000; includeSubDomains",
			},
			{
				key: "Cross-Origin-Opener-Policy",
				value: "same-origin",
			},
			{
				key: "Cross-Origin-Resource-Policy",
				value: "same-origin",
			},
			{
				key: "X-Permitted-Cross-Domain-Policies",
				value: "none",
			},
		];

		// Full CSP for authenticated app and auth routes.
		// unsafe-eval only in development (required by Next.js HMR).
		const isDev = process.env.NODE_ENV === "development";
		const supabaseStorage = "https://mbivfenbnvkquxajwbju.storage.supabase.co";
		const appCsp = [
			"default-src 'self'",
			`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
			"style-src 'self' 'unsafe-inline'",
			`img-src 'self' https: data: blob: https://*.supabase.co ${supabaseStorage}`,
			`connect-src 'self' blob: https://*.supabase.co ${supabaseStorage}`,
			`frame-src 'self' ${supabaseStorage} https://docs.google.com blob:`,
			"font-src 'self'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join("; ");

		return [
			// SaaS app routes — no cache, strict framing, full CSP
			{
				source: "/app/:path*",
				headers: [
					...securityHeaders,
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value: appCsp,
					},
					{
						key: "Cache-Control",
						value: "no-store, no-cache, must-revalidate",
					},
				],
			},
			// Auth routes — no cache, deny framing, full CSP
			{
				source: "/auth/:path*",
				headers: [
					...securityHeaders,
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value: appCsp,
					},
					{
						key: "Cache-Control",
						value: "no-store, no-cache, must-revalidate",
					},
				],
			},
			// Owner portal — no cache, no X-Frame-Options (allow embedding)
			{
				source: "/owner/:path*",
				headers: [
					...securityHeaders,
					{
						key: "Cache-Control",
						value: "no-store",
					},
				],
			},
			// Share routes — cacheable
			{
				source: "/share/:path*",
				headers: [
					...securityHeaders,
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Cache-Control",
						value: "public, max-age=300, s-maxage=600",
					},
				],
			},
			// API routes — no cache
			{
				source: "/api/:path*",
				headers: [
					...securityHeaders,
					{
						key: "Cache-Control",
						value: "no-store",
					},
				],
			},
			// Marketing / catch-all — cacheable, deny framing
			{
				source: "/:path*",
				headers: [
					...securityHeaders,
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
				],
			},
		];
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/ar",
				permanent: true,
			},
			{
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/:organizationSlug/settings",
				destination: "/app/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
			// Pricing restructure redirects (permanent)
			{
				source: "/app/:slug/finance/quotations",
				destination: "/app/:slug/pricing/quotations",
				permanent: true,
			},
			{
				source: "/app/:slug/finance/quotations/:path*",
				destination: "/app/:slug/pricing/quotations/:path*",
				permanent: true,
			},
			{
				source: "/app/:slug/quantities",
				destination: "/app/:slug/pricing/studies",
				permanent: true,
			},
			{
				source: "/app/:slug/quantities/:path*",
				destination: "/app/:slug/pricing/studies/:path*",
				permanent: true,
			},
		];
	},
	webpack: (config, { webpack, isServer }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		if (isServer) {
			config.plugins.push(new PrismaPlugin());
		}

		return config;
	},
};

export default withContentCollections(withNextIntl(nextConfig));
