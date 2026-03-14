# Acceptance Criteria (JTBD-Aligned)

## Queue Intent Flow
- Given a queued spell row, when the user picks `Add`, `Replace`, or `Queue-only`, then intent updates immediately without dropdown interaction.
- Given `Replace` intent, when no replace target is selected, then apply is blocked with clear required messaging.
- Given `Replace` intent, replace target options are limited to currently prepared spells in the same spell list.

## Apply Semantics
- Given queued entries, apply includes only `Add` and valid `Replace` actions.
- Given queued entries, `Queue-only` entries are excluded from apply operations.
- After successful apply, applied entries are removed from queue and `Queue-only` entries remain.

## Runtime Behavior
- Local/pages runtime loads spell snapshot from static artifact and does not require API.
- Production builds use the same committed spell snapshot as local/pages runtime.

## Extension Behavior
- Sync payload remains version 3.
- Extension validates payload shape and provides acknowledgement response.
