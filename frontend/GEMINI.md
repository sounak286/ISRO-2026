# Instruction Rules for Gemini / Coding Agents

This file outlines the core rules and constraints that any LLM model or autonomous coding agent must strictly adhere to when working on the **India Climate Twin** project.

### Mandatory Directives

1. **Use Skills Promptly**: Always check and use project or plugin skills whenever necessary for specialized operations (e.g., Tailwind CSS design systems, shadcn, devtools, science data, etc.). Refer to the guidelines in the `<skills>` section.
2. **Project Reference Documents**: Always consult and align with the following documentation files when making design, development, or implementation decisions:
    - [PRD.md](./docs/PRD.md): Product Requirements Document detailing product vision, features, MVP scope, target users, and constraints.
    - [TRD.md](./docs/TRD.md): Technical Requirements Document outlining the engineering architecture, dependencies, libraries, and coding guidelines.
    - [FLOW.md](./docs/FLOW.md): Flow specifications describing the user journey, navigation transitions, and app state flows.
    - [UI.md](./docs/UI.md): UI structure documenting layout structures, page sections, wireframe specifications, and component layout hierarchies.
    - [DESIGN.md](./docs/DESIGN.md): Design system specifications covering aesthetics, colors, typography, gradients, animations, and styling guidelines.
    - [SCHEMA.md](./docs/SCHEMA.md): Data schema definitions covering types, state interfaces, data structures, and mock data format specifications.
3. **Mapping & Terrae Library**: Always refer to the [TERRAE.md](./docs/TERRAE.md) reference cheat sheet when working on mapping features, layers, weather effects, or anything related to the `terrae` library. Always use MapLibre GL for terrae.
4. **No Browser Testing**: Never launch a browser subagent or browser instance to verify code execution or styling yourself. The user will test and review all modifications manually.
5. **No Dev Servers / Script Execution**: Never start a live running server or preview environment (e.g., `npm run dev`, `npm start`, or equivalent background dev processes). The user will run all dev environments and verify the application directly on their local machine.
