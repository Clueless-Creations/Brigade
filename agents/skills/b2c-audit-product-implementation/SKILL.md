---
name: b2c-audit-product-implementation
description: "Review intended versus observed Product Profile delta and evidence boundaries without inventing missing runtime proof."
compatibility: Brigade product-profile/v1. Managed workspace profile operations require the local Brigade runtime; standalone reasoning can use supplied profile projections.
metadata:
  source-contract: "product-profile/v1"
  generated-by: "brigade"
---

# Audit a product implementation

Read the compatible intended/observed delta first. Treat absent observation as unresolved, not failed. Follow evidence IDs only for material findings. Separate matched, changed, extra, and unresolved behavior. Findings inform review and planning; they do not rewrite product.yaml or DESIGN.md.

## Context discipline

Prefer bounded Product Profile query/delta output. Do not load full source documents, screenshots, recordings, or evidence bodies unless the task requires them. Passive retrieval never triggers Jev or another provider.
