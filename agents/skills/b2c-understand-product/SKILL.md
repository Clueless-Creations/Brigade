---
name: b2c-understand-product
description: "Use bounded Product Profile retrieval to explain how an intended or observed consumer product works without loading the full profile or raw evidence."
compatibility: Brigade product-profile/v1. Managed workspace profile operations require the local Brigade runtime; standalone reasoning can use supplied profile projections.
metadata:
  source-contract: "product-profile/v1"
  generated-by: "brigade"
---

# Understand a product

Query the intended profile for accepted behavior or the observed profile for demonstrated runtime behavior. Start with stable IDs when known; otherwise use a bounded text query. Preserve profile revision, provenance, and claim status in the answer. Request evidence only when the question actually requires proof. Never treat the profile as the owner of accepted product truth.

## Context discipline

Prefer bounded Product Profile query/delta output. Do not load full source documents, screenshots, recordings, or evidence bodies unless the task requires them. Passive retrieval never triggers Jev or another provider.
