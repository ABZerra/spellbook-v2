# Example Input: Meeting Artifact Router

Meeting transcript file:

```yaml
title: Checkout Planning Sync
date: 2026-03-03
participants:
  - Maya
  - Theo
  - Sam
source: zoom
project: checkout-revamp
type_hint: feature-planning
github_repo: acme/checkout-revamp
language: en
has_timestamps: true
has_speakers: true
```

Transcript:

- Maya: Support says buyers drop off when card verification loops on slow networks.
- Theo: We should redesign the retry state and clarify the status message so users know the payment is still processing.
- Sam: We need to confirm whether legal wants a different disclaimer for saved cards.
- Maya: This sounds feature-sized, not just a copy fix. We need a short PRD and then delivery tickets for retry-state UI, telemetry, and QA coverage.
- Theo: Engineering can split the work into a frontend retry-state ticket and a telemetry ticket once the user outcome is locked.
- Sam: We should ask legal about the disclaimer before drafting acceptance criteria for the saved-card path.
