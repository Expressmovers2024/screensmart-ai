# ============================================================
#  ScreenSmart AI — Developer Workflow
#  Run `make help` to see all available commands.
# ============================================================

# Default target — shows help when you just type `make`
.DEFAULT_GOAL := help

# Detect OS so open/xdg-open works on Mac and Linux
UNAME := $(shell uname)
ifeq ($(UNAME), Darwin)
  OPEN := open
else
  OPEN := xdg-open
endif


# ── PATCH WORKFLOW ───────────────────────────────────────────
# This is the main workflow for applying AI-generated patches.
#
# Every time Claude generates a zip, you:
#   1. Download the zip to your Downloads folder
#   2. Run:  make apply PATCH=~/Downloads/the-patch-name.zip
#
# That's it. The script handles everything else.

.PHONY: apply
apply: ## Apply an AI-generated patch zip and push to GitHub
	@if [ -z "$(PATCH)" ]; then \
		echo ""; \
		echo "  Usage:  make apply PATCH=~/Downloads/your-patch.zip"; \
		echo ""; \
		echo "  Example:"; \
		echo "  make apply PATCH=~/Downloads/screensmart-infra-hardening-patch.zip"; \
		echo ""; \
		exit 1; \
	fi
	@bash scripts/apply-patch.sh "$(PATCH)"


# ── GIT SHORTCUTS ────────────────────────────────────────────

.PHONY: status
status: ## Show what has changed (beginner-friendly view)
	@echo ""
	@echo "=== Current branch ==="
	@git branch --show-current
	@echo ""
	@echo "=== Changed files ==="
	@git status --short
	@echo ""
	@echo "=== Last 5 commits ==="
	@git log --oneline -5
	@echo ""

.PHONY: push
push: ## Push the current branch to GitHub
	@echo "Pushing to GitHub..."
	@git push -u origin $$(git branch --show-current)
	@echo ""
	@echo "Done! Open a Pull Request at:"
	@echo "https://github.com/Expressmovers2024/screensmart-ai/compare/$$(git branch --show-current)"
	@echo ""

.PHONY: pull
pull: ## Pull latest changes from GitHub
	@git pull origin $$(git branch --show-current)

.PHONY: main
main: ## Switch back to the main branch
	@git checkout main
	@git pull origin main
	@echo "You are now on main, up to date."


# ── SESSION TOOLS ────────────────────────────────────────────

.PHONY: session
session: ## Start a new AI session branch (e.g. make session NAME=vision-improvements)
	@if [ -z "$(NAME)" ]; then \
		echo ""; \
		echo "  Usage:  make session NAME=your-feature-name"; \
		echo "  Example: make session NAME=talkback-improvements"; \
		echo ""; \
		exit 1; \
	fi
	@git checkout main
	@git pull origin main
	@git checkout -b "ai/$(NAME)"
	@echo ""
	@echo "Ready! You are now on branch: ai/$(NAME)"
	@echo "When Claude gives you a patch zip, run:"
	@echo "  make apply PATCH=~/Downloads/the-patch.zip"
	@echo ""

.PHONY: log
log: ## Show full commit history with dates
	@git log --pretty=format:"%C(yellow)%h%C(reset) %C(cyan)%ad%C(reset) %s" --date=short


# ── PROJECT ──────────────────────────────────────────────────

.PHONY: install
install: ## Install dependencies
	@npm install

.PHONY: start
start: ## Start the Expo development server
	@npx expo start

.PHONY: typecheck
typecheck: ## Check TypeScript types
	@npx tsc --noEmit


# ── HELP ─────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  ScreenSmart AI — Developer Commands"
	@echo "  ─────────────────────────────────────────────────────"
	@echo ""
	@echo "  MAIN WORKFLOW (what you use most):"
	@echo ""
	@echo "    make apply PATCH=~/Downloads/patch.zip   Apply an AI patch and push"
	@echo "    make session NAME=my-feature             Start a new AI work session"
	@echo "    make status                              See what changed"
	@echo "    make push                                Push current branch to GitHub"
	@echo ""
	@echo "  ALL COMMANDS:"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "    %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
