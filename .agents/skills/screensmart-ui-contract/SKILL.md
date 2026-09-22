---
name: screensmart-ui-contract
description: Turn a ScreenSmart UI control into an implementation contract and tested interaction. Use for screen and button work; do not invent existing endpoints, active integrations or completion states.
---
Read the selected screen specification, applicable AGENTS.md and existing routes/services. Identify the actual control and distinguish mockup content from stored records.

Define control ID, route, input schema, authoritative record, access requirement, consequential-action gate, loading/empty/error/offline/stale states, keyboard behavior and completion evidence. Reuse existing registry/repository abstractions. Do not instantiate agents in screens or treat disabled buttons as security.

Implement the smallest scoped change in a review branch. Test relevant interaction and denial paths. Report exact revision, changed paths, commands/results and untested device or integration behavior. Preserve private context; never include it in public fixtures or screenshots.
