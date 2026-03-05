# Connect this project to GitHub (Laptop ↔ Desktop)

Cursor **does not** have a separate “link to GitHub” — it uses **Git** on your computer. Once your project is on GitHub, you use Git (or Cursor’s Source Control) to push and pull. Same repo on laptop and desktop.

---

## Part 1: On your laptop (one-time)

### 1. This repo is already initialized

The project is already a Git repo with an initial commit. If not, you would run:

```bash
cd /home/khturk2/browser-console
git init
git add .
git commit -m "Initial commit"
```

### 2. Create a new repo on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **“+”** (top right) → **New repository**.
3. Name it (e.g. `browser-console`).
4. Leave **“Add a README”** unchecked (you already have code).
5. Click **Create repository**.

### 3. Link this folder to GitHub and push

In a terminal (or Cursor’s terminal), from the project folder:

```bash
cd /home/khturk2/browser-console

# Replace YOUR_USERNAME with your GitHub username and REPO_NAME with the repo name
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

git branch -M main
git push -u origin main
```

When asked for a password, use a **Personal Access Token**, not your GitHub password:

- GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
- Give it a name, check **repo**, generate, then copy and paste it when Git asks for a password.

---

## Part 2: On your desktop PC

### 1. Install Git (if needed)

- Windows: [git-scm.com](https://git-scm.com) or `winget install Git.Git`
- Set your name and email (same as on laptop):

```bash
git config --global user.name "Lior"
git config --global user.email "liorlih63265@gmail.com"
```

### 2. Clone the repo and open in Cursor

```bash
cd C:\Users\YourName\Projects   # or wherever you want the folder
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd REPO_NAME
```

Then in Cursor: **File → Open Folder** → choose that folder.

### 3. Work and sync

- **On laptop:** make changes → in Cursor use **Source Control** (branch icon) or run `git add .`, `git commit -m "message"`, `git push`.
- **On desktop:** before working run `git pull` (or use Cursor’s **Pull**). After working, commit and push the same way.
- Cursor’s **Source Control** panel is just a UI for these Git commands; no extra “link to GitHub” is required.

---

## Summary

| Step | Laptop | Desktop |
|------|--------|---------|
| One-time | Create repo on GitHub, `git remote add origin ...`, `git push -u origin main` | `git clone https://github.com/...` then open folder in Cursor |
| Daily | Edit → Commit → Push | Pull → Edit → Commit → Push |

Your GitHub account is “linked” by Git (remote URL + login when you push/pull). Cursor uses that same Git for version control.
