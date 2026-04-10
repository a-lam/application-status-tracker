# Docs

Documentation for the Applications Tracker project.

---

## Requirements

| File | Description |
|------|-------------|
| [requirements/overview.md](requirements/overview.md) | Project description, goals, operations requirements, constraints, and out-of-scope items |
| [requirements/non-functional.md](requirements/non-functional.md) | Security, performance, observability, deployment, and scalability requirements |
| [requirements/features/authentication.md](requirements/features/authentication.md) | Auth user stories, acceptance criteria, and functional requirements |
| [requirements/features/applications-list.md](requirements/features/applications-list.md) | Applications list user stories, colour-coding rules, acceptance criteria, and functional requirements |
| [requirements/features/add-application.md](requirements/features/add-application.md) | Add application form user stories, date picker and artifact list rules, acceptance criteria, and functional requirements |
| [requirements/features/dark-mode.md](requirements/features/dark-mode.md) | Dark mode user stories, persistence behaviour, and functional requirements |
| [requirements/features/share.md](requirements/features/share.md) | Share feature user stories, acceptance criteria, rate-limiting rules, and functional requirements |

## Technical

| File | Description |
|------|-------------|
| [technical/stack.md](technical/stack.md) | All dependencies and runtime requirements |
| [technical/architecture.md](technical/architecture.md) | System architecture, data models, external integrations, and deployment strategy |
| [technical/modules/authentication-module.md](technical/modules/authentication-module.md) | Auth component architecture, data flows, API endpoints, and security notes |
| [technical/modules/applications-list-module.md](technical/modules/applications-list-module.md) | Applications list component architecture, urgency band logic, data flow, DB model, and API endpoints |
| [technical/modules/add-application-module.md](technical/modules/add-application-module.md) | Add application component architecture, artifact schema, date picker behaviour, form submission flow, and API contract |
| [technical/modules/dark-mode-module.md](technical/modules/dark-mode-module.md) | Dark mode implementation approach: CSS tokens, theme hook, ThemeContext, flash-free init, and files to change |
| [technical/modules/share-module.md](technical/modules/share-module.md) | Share module component architecture, data models (Share, RecipientSession, ShareRateLimit), API endpoints, data flows, and security notes |

## Design

| File | Description |
|------|-------------|
| [design/pages/login.md](design/pages/login.md) | Login page purpose, components, user interactions, and wireframes |
| [design/pages/applications-list.md](design/pages/applications-list.md) | Applications list page layout, colour-coding guide, card wireframe, and accessibility notes |
| [design/pages/add-application.md](design/pages/add-application.md) | Add application page layout, calendar and artifact wireframes, validation states, and accessibility notes |
| [design/dark-mode.md](design/dark-mode.md) | Dark mode design tokens, urgency band colours, badge colours, toggle UI specs, and resolved design decisions |
| [design/pages/share.md](design/pages/share.md) | Share management page, recipient verification page, and shared view page layouts, states, and accessibility notes |
