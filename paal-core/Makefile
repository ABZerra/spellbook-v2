PYTHON ?= python3

.PHONY: validate validate-skills validate-research-artifacts validate-discovery-artifacts validate-ticket-artifacts validate-roadmap-artifacts validate-prd-artifacts validate-project-repo-templates validate-meeting-router reindex

validate: validate-skills validate-research-artifacts validate-discovery-artifacts validate-ticket-artifacts validate-roadmap-artifacts validate-prd-artifacts validate-project-repo-templates validate-meeting-router reindex

validate-skills:
	$(PYTHON) scripts/validate_skills.py

validate-research-artifacts:
	$(PYTHON) scripts/validate_research_artifacts.py

validate-discovery-artifacts:
	$(PYTHON) scripts/validate_discovery_artifacts.py

validate-ticket-artifacts:
	$(PYTHON) scripts/validate_ticket_artifacts.py

validate-roadmap-artifacts:
	$(PYTHON) scripts/validate_roadmap_artifacts.py

validate-prd-artifacts:
	$(PYTHON) scripts/validate_prd_artifacts.py

validate-project-repo-templates:
	$(PYTHON) scripts/validate_project_repo_templates.py

validate-meeting-router:
	$(PYTHON) scripts/validate_meeting_router.py

reindex:
	$(PYTHON) scripts/reindex_skills.py
