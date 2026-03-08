# Example Output: project-template-writer

# Project Template: Product Launch Kickstart

## Summary

Define one canonical project template for launch planning and map it to Notion, Word, Excel, and Jira while preserving the original Kickstart structure and view fidelity.

## Source Fidelity Contract

- Top-level order: `Project Vision`, `Roadmap`, `Initiatives`, `Resources`.
- Notion Roadmap views: `Milestones`, `Timeline`, `Table`.
- Notion Initiatives views: `Kanban`, `Table`.
- Notion Resources views: `Resource Table`, `Sorted A-Z List`.

## Notion Exact Page Blueprint

### Page block order

1. `Project Kickstart Template` title
2. `Project Kickstart Template - README` link
3. Divider
4. `⭐ Project Vision:` callout
5. `Roadmap` section with views `Milestones`, `Timeline`, `Table`
6. `Initiatives` section with views `Kanban`, `Table`
7. `Resources` section with views `Resource Table`, `Sorted A-Z List`

### Notion seed records (sample mode)

- Roadmap row:
  - `Name=Milestone`
  - `Problem Statement=This is the problem statement, mean to be displayed on views that use cards`
  - `Timeline=2025-07-31 to 2025-08-31`
- Initiatives row:
  - `Name=Initiative 1`
  - `Status=In progress`
  - `Milestones=Milestone`
  - `Area=Product`
- Resources row:
  - `Name=Resource 1`
  - `Description=this is the resource used on initiatives`
  - `Milestone=Milestone`
  - `Initiative=Initiative 1`
  - `Initiative Area=Product`

## Core Model (Tool-Agnostic)

### Entities

- Vision: Strategic direction and problem statement.
- Roadmap: Milestones with dates and milestone-level outcomes.
- Initiatives: Execution workstreams linked to milestones.
- Resources: Dependencies and assets linked to initiatives.

### Relationships

- Vision -> Roadmap
- Roadmap -> Initiatives
- Initiatives -> Resources

### Canonical Fields

| Entity | Field | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| Vision | Project Vision | rich-text | yes | Top-level strategy statement |
| Roadmap | Name | string | yes | Milestone title |
| Roadmap | Timeline | date-range | yes | Start/end date |
| Roadmap | Problem Statement | rich-text | yes | Visible on milestone cards |
| Roadmap | Initiatives | relation[] | yes | Links to initiatives |
| Initiatives | Status | enum | yes | Not started/In progress/Done |
| Initiatives | Milestones | relation[] | yes | Links to roadmap |
| Initiatives | Resources | relation[] | no | Links to resources |
| Resources | Name | string | yes | Resource item |
| Resources | Description | text | no | Resource notes |
| Resources | Milestone | relation | yes | Linked roadmap item |
| Resources | Initiative | relation | yes | Linked initiative item |

## Destination Adapter Mapping

### Notion Mapping

| Canonical field | Notion property/view |
| --- | --- |
| Vision.Project Vision | Project Vision callout at top |
| Roadmap.Name | Title |
| Roadmap.Timeline | Date |
| Roadmap.Problem Statement | Text/Rich text |
| Initiatives.Status | Select |
| Roadmap views | Milestones/Timeline/Table |
| Initiatives views | Kanban/Table |
| Resources views | Resource Table/Sorted A-Z List |

### Excel Mapping

| Canonical field | Sheet.Column |
| --- | --- |
| Vision.Project Vision | Vision.ProjectVision |
| Roadmap.Name | Roadmap.Name |
| Roadmap.Timeline | Roadmap.TimelineStart/Roadmap.TimelineEnd |
| Initiatives.Status | Initiatives.Status |
| Resources.Description | Resources.Description |

### Jira Mapping

| Canonical field | Jira field |
| --- | --- |
| Roadmap.Name | Epic Summary |
| Roadmap.Timeline | Epic Start Date / Due Date |
| Initiatives.Name | Story Summary |
| Resources.Description | Task Description |

## Import and Export Contract

- Import: CSV per entity (`roadmap.csv`, `initiatives.csv`, `resources.csv`).
- Export: CSV bundle with validation report.
- Validation: fail fast on missing required fields, invalid status values, and unresolved required relations.

## Open Questions

| Question | Current answer |
| --- | --- |
| Jira hierarchy mapping for roadmap milestones | TBD |
