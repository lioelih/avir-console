# Move this project to your main PC and keep the agent in the loop

You code on your **main PC**. The project currently lives on your **laptop**. Use GitHub as the bridge: push once from the laptop, then clone and work on the PC. All design and contracts live in the repo, so the agent on the PC has full context.

---

## Step A: On your laptop (one-time — do this first)

### A1. Create a new repo on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **"+"** (top right) → **New repository**.
3. Name it (e.g. `browser-console`).
4. Leave **"Add a README"** unchecked.
5. Click **Create repository**.

### A2. Push this project to GitHub

In a terminal on the laptop, in the project folder:

```bash
cd /home/khturk2/browser-console

# Replace YOUR_USERNAME and REPO_NAME with your GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

When Git asks for a password, use a **Personal Access Token** (not your GitHub password):

- GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
- Name it, check **repo**, generate, then paste it when prompted.

After this, the project (including all `.cursor/` notes, contracts, and rules) is on GitHub.

---

## Step B: On your main PC (your new main workspace)

### B1. Install Git (if not already)

- [git-scm.com](https://git-scm.com) or `winget install Git.Git`
- Set your identity (use the same email as on GitHub):

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### B2. Clone the repo

```bash
cd C:\Users\YourName\Projects
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd REPO_NAME
```

### B3. Install dependencies and open in Cursor

```bash
npm install
```

Then in **Cursor**: **File → Open Folder** → select the cloned project folder.

### B4. So the agent on the PC has full context

All project context is **already in the repo**:

- **Dev flow, goals, architecture, message contracts:**  
  `.cursor/notes/dev-flow-steps-1-2.md`
- **Current work contract (e.g. E2E mocks):**  
  `.cursor/contracts/e2e-mocks-poc.md`
- **Meta and rules:**  
  `.cursor/meta.mdc`, `.cursor/rules/`, `.cursor/guide/`

The repo root also has **`AGENTS.md`**: a short note that tells the agent to read these paths first. When you open the folder on the PC and chat with the agent, you can say once:

- *"Read AGENTS.md and .cursor/notes/dev-flow-steps-1-2.md so you have full project context."*

After that, the agent on the PC can use the same design, contracts, and rules to help you.

---

## Summary

| Where   | What to do |
|--------|------------|
| **Laptop (once)** | Create repo on GitHub → `git remote add origin ...` → `git push -u origin main` |
| **PC (once)**     | `git clone ...` → `npm install` → Open folder in Cursor. Optionally tell the agent: "Read AGENTS.md and .cursor/notes/dev-flow-steps-1-2.md for context." |
| **PC (daily)**    | `git pull` before work; commit and push when you’re done. |

No need to “link Cursor to GitHub” separately — Git on the PC is connected via the clone URL and your login when you push/pull.
