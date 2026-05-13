# ScreenSmart AI — Developer Workflow Guide

How to apply AI-generated patches and push to GitHub, from scratch.

---

## One-time setup

You only do this once.

### 1. Install prerequisites

**Mac:**
```bash
# Install Homebrew (Mac package manager) if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install git and node
brew install git node
```

**Windows:**  
Download and install [Git for Windows](https://git-scm.com/download/win) and [Node.js](https://nodejs.org).

---

### 2. Clone your repo

```bash
# Download your project to your computer
git clone https://github.com/Expressmovers2024/screensmart-ai.git

# Go into the project folder
cd screensmart-ai
```

---

### 3. Install project dependencies

```bash
npm install
```

---

### 4. Connect to GitHub

The easiest way is the GitHub CLI:

```bash
# Install it
brew install gh       # Mac
# or: winget install GitHub.cli   (Windows)

# Log in
gh auth login
# Choose: GitHub.com → HTTPS → Login with a web browser → follow the steps
```

---

## Every session — the normal workflow

This is what you do each time you work with Claude.

---

### Step 1 — Start a new session branch

Give your session a short name that describes what you're working on:

```bash
make session NAME=talkback-improvements
```

This creates a clean branch called `ai/talkback-improvements` and switches you to it.  
You only need to do this once per topic — you can apply multiple patches to the same branch.

---

### Step 2 — Work with Claude

Ask Claude to make changes. At the end, Claude will give you a **patch zip file** to download.

---

### Step 3 — Apply the patch

Download the zip file Claude gives you (it goes to your Downloads folder by default).  
Then run one command from your project folder:

```bash
make apply PATCH=~/Downloads/the-file-claude-gave-you.zip
```

Replace `the-file-claude-gave-you.zip` with the actual filename.

**That's it.** The script will:
- Unpack the zip
- Copy all the changed files into your project
- Create one git commit per fix, with proper messages
- Push the branch to GitHub
- Print a link to open a Pull Request

---

### Step 4 — Open the Pull Request

The script prints the URL at the end. Open it in your browser, review the changes, and merge.

---

## Other useful commands

```bash
make status          # See what files have changed
make push            # Push current branch to GitHub manually
make pull            # Pull latest changes from GitHub
make main            # Switch back to the main branch
make typecheck       # Check for TypeScript errors
make start           # Start the Expo dev server
make help            # See all available commands
```

---

## What a patch zip contains

Every zip Claude generates has this structure:

```
my-patch.zip
├── files/                    ← All the changed/new source files
│   ├── constants/
│   ├── services/
│   ├── src/
│   └── ...
└── patch-info.json           ← List of commits and which files belong to each
```

The `patch-info.json` is what lets the script create separate commits per fix
instead of one big commit for everything.

---

## Troubleshooting

**"Command not found: make"**  
Mac: `xcode-select --install`  
Windows: Use Git Bash (included with Git for Windows) or install `make` via `choco install make`.

**"Not a git repository"**  
You're not in your project folder. Run `cd screensmart-ai` first.

**"You have uncommitted changes"**  
Either commit them first (`git add -A && git commit -m "wip"`) or stash them (`git stash`), then run `make apply` again.

**"Push failed"**  
Your commits are saved locally. Run `make push` to try again, or run `gh auth login` to reconnect GitHub.

**The wrong zip was applied**  
Run `git log --oneline` to see the commits. Run `git reset HEAD~N` (replace N with how many commits to undo) to go back, then try again with the right zip.

---

## How patches get their commit messages

Every patch zip Claude produces includes a `patch-info.json` file that maps
each changed file to a specific commit message. The `apply-patch.sh` script
reads that file so your git history stays clean and meaningful — one commit
per logical fix, not one giant "applied AI changes" blob.
