# Example Input: project-context-bootstrap

We have a new project repo and need to make it the working source of truth for product context.

Context:
- The repo should carry the product context from day one, not just engineering files.
- Discovery and PRD work will happen inside this project repo while using the PAAL core submodule.
- The project language is still evolving, so the glossary needs to exist immediately.
- Engineers should be able to read the repo and understand the product context without relying on Notion.
- We still need a Markdown output that can be pasted or imported into tools like Notion, Jira, and Linear.

Constraints:
- Keep the flow Markdown-first.
- Keep real-time sync and exact tool field mapping out of scope.
- Make it explicit how context is kept current through pull requests.
