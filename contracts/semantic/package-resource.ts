import { z } from "zod";

/**
 * Package-level declaration for a supported semantic resource (question-pack).
 * First-party and external packages use the same schema — no kernel/vendor privilege field.
 * Executable extension semantics remain experimental when later wired through package schemas.
 */

export const SEMANTIC_RESOURCE_API = "b2c.semantic/v1" as const;

const exportedId = z
  .string()
  .regex(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9.-]*$/u)
  .max(160);
const resourcePath = z
  .string()
  .min(1)
  .max(512)
  .refine(
    (value) =>
      !value.includes("\\") &&
      !value.includes("\0") &&
      !value.startsWith("/") &&
      !value.includes(":") &&
      value.split("/").every((part) => part.length > 0 && part !== "." && part !== ".."),
    "Use a relative package path with no traversal, empty segments, or platform prefix.",
  );

export const semanticPackageResourceSchema = z.strictObject({
  apiVersion: z.literal(SEMANTIC_RESOURCE_API),
  kind: z.literal("question-pack"),
  id: exportedId,
  version: z.string().regex(/^\d+\.\d+\.\d+$/u),
  path: resourcePath,
  mediaType: z.enum(["application/json", "application/yaml", "text/yaml"]),
  experimental: z.literal(true),
});
export type SemanticPackageResource = z.infer<typeof semanticPackageResourceSchema>;

export function parseSemanticPackageResource(input: unknown): SemanticPackageResource {
  assertNoKernelPrivilegeClaim(input);
  return semanticPackageResourceSchema.parse(input);
}

export function assertNoKernelPrivilegeClaim(input: unknown): void {
  if (input && typeof input === "object") {
    for (const key of Object.keys(input as Record<string, unknown>)) {
      if (/privilege|kernelVendor|vendorPrivilege|kernelOnly/i.test(key)) {
        throw new Error(`semantic_package_resource_forbidden_field:${key}`);
      }
    }
  }
}
