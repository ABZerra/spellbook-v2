# Project Template: Project Kickstart (Tool-Agnostic Baseline)

## Summary

Define one canonical Project Kickstart template that preserves the original structure (`Vision -> Roadmap -> Initiatives -> Resources`) and maps it consistently to Notion, Word, Excel, and Jira.

## Template Metadata

- Status: Draft | In Review | Approved | Active
- Template owner: <name or TBD>
- Template version: 1.0.0
- Last updated: <YYYY-MM-DD>
- In-scope tools: Notion | Word | Excel | Jira
- Source fidelity artifacts: <report link/path> | <screenshot link/path>

## Source Fidelity Contract (Required)

### Top-level layout

- Title section: `Project Kickstart Template`
- Link block to README/reference page
- Divider under README link
- `Project Vision` callout/section before data sections
- Section order: `Roadmap`, `Initiatives`, `Resources`

### Required default views (Notion baseline)

- Roadmap views: `Milestones`, `Timeline`, `Table`
- Initiatives views: `Kanban`, `Table`
- Resources views: `Resource Table`, `Sorted A-Z List`

## Notion Exact Page Blueprint (Required when Notion is in scope)

### Page block order

| Order | Block type | Required content |
| --- | --- | --- |
| 1 | Page title | `Project Kickstart Template` |
| 2 | Link block | `Project Kickstart Template - README` |
| 3 | Divider | Horizontal rule under README link |
| 4 | Callout/paragraph | `⭐ Project Vision:` |
| 5 | Section | `Roadmap` |
| 6 | Linked database section | Roadmap with views `Milestones`, `Timeline`, `Table` |
| 7 | Section | `Initiatives` |
| 8 | Linked database section | Initiatives with views `Kanban`, `Table` |
| 9 | Section | `Resources` |
| 10 | Linked database section | Resources with views `Resource Table`, `Sorted A-Z List` |

### Database contract (exact names)

#### Roadmap database

| Property | Type | Required |
| --- | --- | --- |
| Name | Title | yes |
| Timeline | Date range | yes |
| Problem Statement | Rich text | yes |
| Initiatives | Relation -> Initiatives | yes |
| Initiatives Resources | Rollup | no |
| Initiatives Area | Rollup | no |

Required views:
- `Milestones` (cards; display `Problem Statement` and `Timeline`)
- `Timeline`
- `Table`

#### Initiatives database

| Property | Type | Required |
| --- | --- | --- |
| Name | Title | yes |
| Status | Select (`Not started`, `In progress`, `Done`) | yes |
| Person | Person | no |
| Area | Select/Text | no |
| ID | Text | no |
| Live Version | URL | no |
| Milestones | Relation -> Roadmap | yes |
| Resources | Relation -> Resources | no |

Required views:
- `Kanban` (group by `Status`)
- `Table`

#### Resources database

| Property | Type | Required |
| --- | --- | --- |
| Name | Title | yes |
| Description | Rich text | no |
| Milestone | Relation -> Roadmap | yes |
| Initiative | Relation -> Initiatives | yes |
| Initiative Area | Rollup | no |

Required views:
- `Resource Table`
- `Sorted A-Z List`

### Seed record fidelity (for sample mode)

| Database | Field values |
| --- | --- |
| Roadmap | `Name=Milestone`, `Problem Statement=This is the problem statement, mean to be displayed on views that use cards`, `Timeline=2025-07-31 to 2025-08-31` |
| Initiatives | `Name=Initiative 1`, `Status=In progress`, `Milestones=Milestone`, `Area=Product` |
| Resources | `Name=Resource 1`, `Description=this is the resource used on initiatives`, `Milestone=Milestone`, `Initiative=Initiative 1`, `Initiative Area=Product` |

### Notion fidelity acceptance checklist

- Page sections appear in exact order defined in `Page block order`.
- All required databases exist with exact names and required properties.
- All required Notion view names exist exactly as specified.
- `Initiatives.Kanban` groups by `Status` with columns `Not started`, `In progress`, `Done`.
- Sample mode creates the seed records above with valid relations.

## Core Model (Tool-Agnostic)

### Entities

- Vision: Top-level direction and problem framing.
- Roadmap: Milestones and timeline outcomes.
- Initiatives: Workstreams linked to roadmap milestones.
- Resources: Dependencies/assets linked to initiatives and milestones.

### Relationships

- Vision -> Roadmap (1:N)
- Roadmap -> Initiatives (1:N)
- Initiatives -> Resources (1:N)

### Canonical Fields

| Entity | Field | Type | Required (yes/no) | Description |
| --- | --- | --- | --- | --- |
| Vision | Project Vision | rich-text | yes | Strategic context statement |
| Roadmap | Name | string | yes | Milestone title |
| Roadmap | Timeline | date-range | yes | Milestone start and end |
| Roadmap | Problem Statement | rich-text | yes | Milestone card description |
| Roadmap | Initiatives | relation[] | yes | Related initiatives |
| Roadmap | Initiatives Resources | rollup[] | no | Resources rolled up from initiatives |
| Roadmap | Initiatives Area | rollup[] | no | Area rolled up from initiatives |
| Initiatives | Name | string | yes | Initiative title |
| Initiatives | Status | enum | yes | `Not started`, `In progress`, `Done` |
| Initiatives | Person | person | no | Owner/assignee |
| Initiatives | Area | enum/string | no | Owning function area |
| Initiatives | ID | string | no | Optional internal identifier |
| Initiatives | Live Version | url | no | Link to live artifact |
| Initiatives | Milestones | relation[] | yes | Linked roadmap milestone(s) |
| Initiatives | Resources | relation[] | no | Linked resource items |
| Resources | Name | string | yes | Resource title |
| Resources | Description | rich-text | no | Resource notes/details |
| Resources | Milestone | relation | yes | Linked roadmap milestone |
| Resources | Initiative | relation | yes | Linked initiative |
| Resources | Initiative Area | rollup | no | Initiative area rollup |

### Validation Rules

- Required relationship chain must be preserved: `Vision -> Roadmap -> Initiatives -> Resources`.
- `Initiatives.Status` must only contain `Not started`, `In progress`, or `Done`.
- Every `Resources` row must reference both a `Milestone` and an `Initiative`.
- Required views from the Source Fidelity Contract must exist by exact name for Notion output.

## Destination Adapter Mapping

### Notion Mapping

| Canonical entity/field | Notion object/property/view | Notes |
| --- | --- | --- |
| Vision.Project Vision | Callout/paragraph at top of page | Must appear before Roadmap section |
| Roadmap.* | `Roadmap` database | Include three views: `Milestones`, `Timeline`, `Table` |
| Initiatives.* | `Initiatives` database | Include two views: `Kanban`, `Table` |
| Resources.* | `Resources` database | Include two views: `Resource Table`, `Sorted A-Z List` |

### Word Mapping

| Canonical entity/field | Section/table representation | Notes |
| --- | --- | --- |
| Vision.Project Vision | `Project Vision` heading + body paragraph | First content section |
| Roadmap | Milestones table | Include Name, Timeline, Problem Statement |
| Initiatives | Initiatives table grouped by Status | Keep status values unchanged |
| Resources | Resources table | Include links to Milestone and Initiative names |

### Excel Mapping

| Canonical entity/field | Sheet.Column | Notes |
| --- | --- | --- |
| Vision.Project Vision | `Vision!A2` | Single-value section sheet |
| Roadmap fields | `Roadmap` sheet columns | One row per milestone |
| Initiatives fields | `Initiatives` sheet columns | One row per initiative |
| Resources fields | `Resources` sheet columns | One row per resource |

### Jira Mapping

| Canonical entity/field | Jira issue type/field | Notes |
| --- | --- | --- |
| Roadmap.Name/Timeline | Epic summary/target dates | One epic per milestone |
| Initiatives.Name/Status | Story or Task summary/status | Linked to parent epic |
| Resources.Name/Description | Task/Sub-task summary/description | Linked to initiative issue |
| Vision.Project Vision | Project description or kickoff issue | Stored once per project |

## Import and Export Contract

### Import Inputs

- Supported formats: CSV (required), JSON (optional)
- Required files: `roadmap.csv`, `initiatives.csv`, `resources.csv` (optional `vision.md` or `vision.txt`)
- Required relation keys:
  - `initiatives.csv` must map each initiative to roadmap milestone key (`milestone_name` or `milestone_id`)
  - `resources.csv` must map each resource to both milestone and initiative key

### Export Outputs

- Output artifacts:
  - `vision.txt`
  - `roadmap.csv`
  - `initiatives.csv`
  - `resources.csv`
  - `validation-report.md`
- Data completeness expectations:
  - Row counts by entity
  - Count of unresolved links
  - Missing required field counts

### Error Handling and Reporting

- Validation failure behavior: fail-fast for schema or required-relation errors; allow warnings for optional fields.
- Required error categories: schema, enum/value, relationship, duplicate key, permissions, adapter capability gap.

## Setup Workflow

1. Preflight validation (permissions, schema, mapping keys, required files).
2. Create or verify Vision section.
3. Create or verify Roadmap, Initiatives, and Resources entities plus relationships.
4. Apply destination-specific mappings and Notion required view names (when Notion is in scope).
5. Run optional import.
6. Emit setup summary with created objects, warnings, and errors.

## Test Scenarios

| Scenario | Expected result | Status |
| --- | --- | --- |
| Happy path generation | Vision + all entities + relationships + required views are created | TBD |
| Notion view fidelity | Exact required view names exist in each database | TBD |
| Invalid enum value (`Initiatives.Status`) | Validation error with row and field details | TBD |
| Missing required relation in resources import | Import fails with unresolved-link diagnostics | TBD |
| Rerun/idempotency | No unintended duplication or destructive overwrite | TBD |
| Permission failure | Explicit remediation guidance with failed step | TBD |

## Risks and Mitigations

- Risk: Tool capability mismatch causes lossy mappings. - Mitigation: adapter gap reporting in validation report.
- Risk: Relation keys in imports are inconsistent. - Mitigation: required key policy and preflight validation.
- Risk: View naming drift in Notion. - Mitigation: explicit view contract check and rename/create remediation.

## Open Questions

| Question | Why it matters | Current answer (or TBD) | Owner | Due date |
| --- | --- | --- | --- | --- |
| Should Jira mapping use Epics/Stories only or include custom issue hierarchy? | Changes import schema and links | TBD | Product + Jira admin | TBD |
