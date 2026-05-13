#!/usr/bin/env bash
# ============================================================
#  ScreenSmart AI — Apply Patch Script
#
#  Called by: make apply PATCH=~/Downloads/something.zip
#
#  What it does:
#    1. Validates you're in the right repo
#    2. Unpacks the zip to a temp folder
#    3. Reads patch-info.json for commit messages
#    4. Copies each file into the project
#    5. Creates one git commit per fix
#    6. Pushes the branch to GitHub
#    7. Prints the Pull Request URL
# ============================================================

set -e  # Stop immediately if anything fails

# ── Colours for readable output ──────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()    { echo -e "${BLUE}ℹ  $1${RESET}"; }
success() { echo -e "${GREEN}✓  $1${RESET}"; }
warn()    { echo -e "${YELLOW}⚠  $1${RESET}"; }
error()   { echo -e "${RED}✗  $1${RESET}"; exit 1; }
step()    { echo -e "\n${BLUE}── $1${RESET}"; }

# ── Validate input ───────────────────────────────────────────
PATCH_ZIP="$1"

if [ -z "$PATCH_ZIP" ]; then
  error "No patch zip provided. Usage: make apply PATCH=~/Downloads/patch.zip"
fi

# Expand ~ in path (shell doesn't expand it inside scripts automatically)
PATCH_ZIP="${PATCH_ZIP/#\~/$HOME}"

if [ ! -f "$PATCH_ZIP" ]; then
  error "File not found: $PATCH_ZIP"
fi

# ── Validate we're in the ScreenSmart repo ───────────────────
if [ ! -f "package.json" ] || ! grep -q "screensmart" package.json 2>/dev/null; then
  error "Run this from inside your screensmart-ai project folder."
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  error "This folder is not a git repository. Run: git init"
fi

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   ScreenSmart AI — Applying Patch            ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# ── Check for uncommitted changes ────────────────────────────
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  warn "You have uncommitted changes."
  echo "   It is safest to commit or stash them first."
  echo ""
  read -p "   Continue anyway? (y/N): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "   Cancelled. Run: git stash  — then try again."
    exit 0
  fi
fi

# ── Unpack the zip ───────────────────────────────────────────
step "Unpacking patch"
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT   # Clean up temp dir when script exits

unzip -q "$PATCH_ZIP" -d "$WORK_DIR"
success "Unpacked to temp folder"

# Find the files/ directory (handles zips with or without a wrapper folder)
FILES_DIR=$(find "$WORK_DIR" -type d -name "files" | head -1)
INFO_FILE=$(find "$WORK_DIR" -name "patch-info.json" | head -1)

if [ -z "$FILES_DIR" ]; then
  error "Invalid patch zip — expected a 'files/' directory inside the zip."
fi

# ── Read patch metadata ──────────────────────────────────────
step "Reading patch info"

if [ -n "$INFO_FILE" ]; then
  # Parse patch-info.json with python (available everywhere, no jq needed)
  PATCH_NAME=$(python3 -c "import json,sys; d=json.load(open('$INFO_FILE')); print(d.get('name','ai-patch'))" 2>/dev/null || echo "ai-patch")
  PATCH_DESC=$(python3 -c "import json,sys; d=json.load(open('$INFO_FILE')); print(d.get('description','AI-generated patch'))" 2>/dev/null || echo "AI-generated patch")
  BRANCH_NAME=$(python3 -c "import json,sys; d=json.load(open('$INFO_FILE')); print(d.get('branch','ai/patch'))" 2>/dev/null || echo "ai/patch-$(date +%Y%m%d-%H%M%S)")
  HAS_COMMITS=$(python3 -c "import json,sys; d=json.load(open('$INFO_FILE')); print('yes' if d.get('commits') else 'no')" 2>/dev/null || echo "no")
  echo "   Name:    $PATCH_NAME"
  echo "   Branch:  $BRANCH_NAME"
  echo "   Desc:    $PATCH_DESC"
else
  # No patch-info.json — use defaults
  PATCH_NAME="ai-patch"
  BRANCH_NAME="ai/patch-$(date +%Y%m%d-%H%M%S)"
  HAS_COMMITS="no"
  warn "No patch-info.json found — will commit all files together."
fi

# ── Create or switch to branch ───────────────────────────────
step "Setting up branch"
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "$BRANCH_NAME" ]; then
  info "Already on branch: $BRANCH_NAME"
elif git rev-parse --verify "$BRANCH_NAME" > /dev/null 2>&1; then
  info "Branch exists — switching to: $BRANCH_NAME"
  git checkout "$BRANCH_NAME"
else
  info "Creating new branch: $BRANCH_NAME"
  git checkout -b "$BRANCH_NAME"
fi

success "On branch: $(git branch --show-current)"

# ── Apply files and commit ───────────────────────────────────
if [ "$HAS_COMMITS" = "yes" ]; then
  # patch-info.json defines individual commits — apply each one
  step "Applying granular commits"

  COMMIT_COUNT=$(python3 -c "
import json
d = json.load(open('$INFO_FILE'))
print(len(d.get('commits', [])))
" 2>/dev/null || echo "0")

  python3 << PYEOF
import json, subprocess, shutil, os, sys

info_file = '$INFO_FILE'
files_dir = '$FILES_DIR'
project_dir = os.getcwd()

with open(info_file) as f:
    patch = json.load(f)

commits = patch.get('commits', [])
print(f"   Applying {len(commits)} commits...")

for i, commit in enumerate(commits, 1):
    label   = commit.get('label', f'commit-{i}')
    message = commit.get('message', f'fix: {label}')
    files   = commit.get('files', [])

    print(f"\n   [{i}/{len(commits)}] {label}")

    changed = []
    for relative_path in files:
        src = os.path.join(files_dir, relative_path)
        dst = os.path.join(project_dir, relative_path)

        if not os.path.exists(src):
            print(f"   ⚠  Skipping (not in patch): {relative_path}")
            continue

        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        changed.append(relative_path)
        print(f"        ✓  {relative_path}")

    if changed:
        subprocess.run(['git', 'add'] + changed, check=True)
        subprocess.run(['git', 'commit', '-m', message], check=True)
    else:
        print(f"   ⚠  No files applied for this commit — skipping.")

print("\n   All commits applied.")
PYEOF

else
  # No commit map — copy everything and make one commit
  step "Copying files"

  FILE_COUNT=0
  for src_file in $(find "$FILES_DIR" -type f); do
    relative="${src_file#$FILES_DIR/}"
    dst_file="./$relative"
    dst_dir=$(dirname "$dst_file")

    mkdir -p "$dst_dir"
    cp "$src_file" "$dst_file"
    echo "   ✓  $relative"
    FILE_COUNT=$((FILE_COUNT + 1))
  done

  success "$FILE_COUNT files copied"

  step "Committing"
  git add -A
  git commit -m "feat(ai-patch): apply $PATCH_NAME

$PATCH_DESC

Applied via: make apply
Patch file: $(basename "$PATCH_ZIP")"
fi

# ── Push to GitHub ───────────────────────────────────────────
step "Pushing to GitHub"
git push -u origin "$(git branch --show-current)"
PUSH_STATUS=$?

echo ""
if [ $PUSH_STATUS -eq 0 ]; then
  CURRENT="$(git branch --show-current)"
  echo "  ╔══════════════════════════════════════════════════════════╗"
  echo "  ║  ✓  Patch applied and pushed successfully!              ║"
  echo "  ╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "   Branch:  $CURRENT"
  echo ""
  echo "   Open your Pull Request here:"
  echo "   https://github.com/Expressmovers2024/screensmart-ai/compare/$CURRENT"
  echo ""
else
  warn "Push failed. Your commits are saved locally."
  echo "   To push manually, run:  make push"
fi
