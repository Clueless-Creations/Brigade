---
name: b2c-learn-from-reference-product
description: "Use bounded observed-reference Product Profiles to propose adopt, adapt, reject, or unresolved product patterns for a target consumer product."
compatibility: Brigade product-profile/v1. Managed workspace profile operations require the local Brigade runtime; standalone reasoning can use supplied profile projections.
metadata:
  source-contract: "product-profile/v1"
  generated-by: "brigade"
---

# Learn from a reference product

Retrieve only relevant source profile records. Preserve source profile ID/revision and target constraints. Separate structural principles from source branding, copy, assets, and content. Produce proposal-only adopt/adapt/reject/unresolved decisions. Accepted changes must go through the target product/design owners before its intended profile is refreshed.

## Context discipline

Prefer bounded Product Profile query/delta output. Do not load full source documents, screenshots, recordings, or evidence bodies unless the task requires them. Passive retrieval never triggers Jev or another provider.
