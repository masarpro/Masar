/**
 * Type compatibility fix: @hookform/resolvers@5.2.2 vs zod@4.1.x
 *
 * The resolver was compiled against zod/v4/core where _zod.version.minor = 0,
 * but zod@4.1.12 has _zod.version.minor = 1, causing TS2769 overload errors.
 *
 * This override can be removed when @hookform/resolvers ships a version
 * compiled against zod >= 4.1.0.
 */
declare module "@hookform/resolvers/zod" {
	import type { FieldValues, Resolver } from "react-hook-form";
	import type { z } from "zod";

	export function zodResolver<T extends z.ZodType<any, any>>(
		schema: T,
		schemaOptions?: Record<string, unknown>,
		resolverOptions?: {
			mode?: "async" | "sync";
			raw?: boolean;
		},
	): Resolver<z.input<T>, any, z.output<T>>;
}
