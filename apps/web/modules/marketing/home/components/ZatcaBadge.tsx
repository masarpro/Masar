"use client";

import { useTranslations } from "next-intl";

export function ZatcaBadge() {
	const t = useTranslations();

	return (
		<section
			className="py-20 px-6"
			style={{
				background:
					"linear-gradient(180deg, #050508, #06091A)",
			}}
		>
			<div
				className="max-w-[800px] mx-auto relative rounded-[28px] p-[2px] overflow-hidden"
				style={{
					background:
						"linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1), rgba(255,255,255,0.03))",
				}}
			>
				<div
					className="rounded-[26px] p-10 sm:p-12 flex items-center gap-8 flex-wrap justify-center"
					style={{
						background: "rgba(5,5,8,0.95)",
						backdropFilter: "blur(20px)",
					}}
				>
					{/* Icon */}
					<div
						className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-4xl shrink-0"
						style={{
							background:
								"linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))",
							border: "1px solid rgba(16,185,129,0.15)",
							boxShadow: "0 0 30px rgba(16,185,129,0.08)",
						}}
					>
						🏛️
					</div>

					{/* Text */}
					<div className="flex-1 min-w-[220px]">
						<h3 className="text-[21px] font-bold mb-2 text-white">
							{t("zatca.title")}
						</h3>
						<p className="text-white/40 text-sm leading-[1.75]">
							{t("zatca.description")}
						</p>
					</div>

					{/* Badge */}
					<div
						className="shrink-0 rounded-[14px] px-6 py-3 text-[#10B981] font-bold text-[13px]"
						style={{
							background:
								"linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))",
							border: "1px solid rgba(16,185,129,0.2)",
							boxShadow: "0 0 20px rgba(16,185,129,0.06)",
						}}
					>
						{t("zatca.badge")}
					</div>
				</div>
			</div>
		</section>
	);
}
