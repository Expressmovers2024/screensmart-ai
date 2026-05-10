# Agents

This folder defines future agent boundaries only.

Current MVP behavior remains screen-driven and service-driven. The `screenCompanionAgent` is a thin typed facade over existing OCR-grounded AI actions so future multi-agent orchestration can be introduced without coupling UI screens directly to orchestration logic.

Do not add autonomous planning, browser control, desktop control, or background orchestration here until those systems are explicitly in scope.
