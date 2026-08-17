# AI-assisted workflow

This solution was built with OpenAI Codex as a coding assistant. I used one primary prompt: read the supplied brief, implement the project in TypeScript, and prioritize simplicity, concision, idiomatic conventions, right-sized design, and behavior-focused API/UI tests.

The work took six main steps:

1. Read the task, example map, guest data, and supplied image assets.
2. Chose a compact React/Vite frontend and Express REST API served by one Node process.
3. Implemented input validation, typed map responses, guest matching, and in-memory booking behavior.
4. Built the responsive tile map and one-step accessible booking flow using the supplied artwork.
5. Added domain, API, and UI tests, then fixed issues found by type-checking and test runs.
6. Ran the finished app in a browser, checked the core flow, and captured the repository screenshot.

Tools used were Codex file editing and terminal tools, npm, TypeScript, Vitest, Testing Library, Supertest, and browser automation for the final run and screenshot. No sub-agents were used. The AI generated implementation and documentation changes, while the supplied brief and files remained the source of product requirements and test data.
