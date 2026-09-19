import { z } from "zod";
import { semanticQuestionResultSchema } from "./questions.js";

/**
 * Inference receipt and policy-application receipt (SQ-01 / #512).
 *
 * Receipts evidence assessment / deterministic policy application — never runtime proof,
 * accepted product truth, an authority grant, or an executable tool request.
 * Usage/cost may be measured or explicitly `unknown` (unknown ≠ zero).
 */

const id = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9._:-]*$/u);
const nonEmptyText = z.string().trim().min(1).max(2000);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
const isoDateTime = z.iso.datetime({ offset: true });

export const SEMANTIC_EVIDENCE_CLASS = "inference" as const;

export const usageCostSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("measured"),
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
    costCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/u)
      .optional(),
    costAmount: z.number().finite().nonnegative().optional(),
    latencyMs: z.number().finite().nonnegative().optional(),
  }),
  z.strictObject({
    status: z.literal("unknown"),
    reason: nonEmptyText.max(400).optional(),
  }),
]);
export type UsageCost = z.infer<typeof usageCostSchema>;

export const coverageSchema = z.strictObject({
  includedSourceIds: z.array(id).max(256),
  omittedSourceIds: z.array(id).max(256).default([]),
  omittedFields: z.array(nonEmptyText.max(320)).max(256).default([]),
  notes: nonEmptyText.max(1000).optional(),
});

export const inferenceReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("inference-receipt"),
  evidenceClass: z.literal(SEMANTIC_EVIDENCE_CLASS),
  receiptId: id,
  requestId: id,
  attemptId: id,
  workspaceId: id.optional(),
  planId: id,
  planIdentity: sha256,
  questionPackId: id,
  questionPackDigest: sha256,
  projectionDigest: sha256,
  sourceRevisions: z
    .array(
      z.strictObject({
        sourceId: id,
        revision: nonEmptyText.max(320),
      }),
    )
    .min(1)
    .max(128),
  coverage: coverageSchema,
  binding: z.strictObject({
    providerBindingId: id,
    adapterDigest: sha256.optional(),
    requestedModel: nonEmptyText.max(320).optional(),
    returnedModel: nonEmptyText.max(320).optional(),
  }),
  results: z.array(semanticQuestionResultSchema).min(1).max(256),
  usageCost: usageCostSchema,
  recordedAt: isoDateTime,
  privacy: z
    .strictObject({
      dataClassification: nonEmptyText.max(120).optional(),
      purpose: nonEmptyText.max(320).optional(),
      retentionRef: nonEmptyText.max(320).optional(),
    })
    .optional(),
});
export type InferenceReceipt = z.infer<typeof inferenceReceiptSchema>;

export const policyApplicationReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("policy-application-receipt"),
  evidenceClass: z.literal(SEMANTIC_EVIDENCE_CLASS),
  receiptId: id,
  inferenceReceiptId: id,
  inferenceReceiptDigest: sha256,
  policyDigest: sha256,
  decision: z.strictObject({
    outcome: z.enum(["apply", "defer", "reject", "require-observation"]),
    selectedAlternativeId: id.optional(),
    excludedAlternatives: z
      .array(
        z.strictObject({
          alternativeId: id,
          reason: nonEmptyText.max(500),
        }),
      )
      .max(64)
      .default([]),
  }),
  derived: z.record(z.string().max(160), z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.null()])).default({}),
  recordedAt: isoDateTime,
});
export type PolicyApplicationReceipt = z.infer<typeof policyApplicationReceiptSchema>;

export const semanticReceiptSchema = z.discriminatedUnion("kind", [inferenceReceiptSchema, policyApplicationReceiptSchema]);
export type SemanticReceipt = z.infer<typeof semanticReceiptSchema>;

export function parseInferenceReceipt(input: unknown): InferenceReceipt {
  const receipt = inferenceReceiptSchema.parse(input);
  assertReceiptIsNotAuthority(receipt);
  return receipt;
}

export function parsePolicyApplicationReceipt(input: unknown): PolicyApplicationReceipt {
  const receipt = policyApplicationReceiptSchema.parse(input);
  assertReceiptIsNotAuthority(receipt);
  return receipt;
}

export function parseSemanticReceipt(input: unknown): SemanticReceipt {
  const receipt = semanticReceiptSchema.parse(input);
  assertReceiptIsNotAuthority(receipt);
  return receipt;
}

export const runtimeProofClaimSchema = z.strictObject({
  kind: z.literal("runtime-proof"),
  proofId: id,
  verified: z.literal(true),
});

export const acceptedProductTruthSchema = z.strictObject({
  kind: z.literal("accepted-product-truth"),
  claimId: id,
  accepted: z.literal(true),
});

export const authorityGrantSchema = z.strictObject({
  kind: z.literal("authority-grant"),
  grantId: id,
  permission: nonEmptyText.max(200),
});

export const executableToolRequestSchema = z.strictObject({
  kind: z.literal("executable-tool-request"),
  toolName: nonEmptyText.max(200),
  arguments: z.record(z.string().max(100), z.unknown()),
});

export function receiptParsesAsForbiddenAuthority(input: unknown): boolean {
  return (
    runtimeProofClaimSchema.safeParse(input).success ||
    acceptedProductTruthSchema.safeParse(input).success ||
    authorityGrantSchema.safeParse(input).success ||
    executableToolRequestSchema.safeParse(input).success
  );
}

function assertReceiptIsNotAuthority(receipt: SemanticReceipt): void {
  if (receiptParsesAsForbiddenAuthority(receipt)) {
    throw new Error("semantic_receipt_authority_confusion");
  }
  if (receipt.evidenceClass !== SEMANTIC_EVIDENCE_CLASS) {
    throw new Error("semantic_receipt_evidence_class");
  }
}
