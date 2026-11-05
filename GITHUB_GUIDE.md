# How to upload CodeSync to your GitHub

## Option A - terminal (recommended)

### 1. Create the empty repository on github.com
1. Sign in at **github.com**
2. Click the **+** icon (top-right) and choose **New repository**
3. Repository name: `codesync`
4. Description (optional): `Real-time collaborative code editor - MERN + Socket.IO`
5. Choose **Public** (or Private, your call)
6. **Do NOT** tick "Add a README", ".gitignore" or "license" - your project already has these
7. Click **Create repository** and keep the page open

### 2. Push your local project
Open a terminal **inside the unzipped `codesync` folder** and run, one line at a time:

```bash
git init
git add .
git commit -m "Initial commit: CodeSync - real-time collaborative code editor (MERN)"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/codesync.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. When prompted, sign in with your GitHub account (or use a Personal Access Token as the password).

Refresh the GitHub page - your code is live. The `node_modules` folder is **not** uploaded because `.gitignore` excludes it.

## Option B - GitHub Desktop (no terminal)

1. Install **GitHub Desktop** (desktop.github.com) and sign in
2. **File > Add local repository...** and select the unzipped `codesync` folder
3. It will say the folder is not a repository - click **Create a repository** (leave the Git ignore dropdown as "None"; the project ships its own `.gitignore`)
4. Type a summary like `Initial commit` and click **Commit to main**
5. Click **Publish repository** - untick "Keep this code private" if you want it public

## After uploading - polish tips

- **About panel** (gear icon, top-right of the repo): paste the description and add topics: `mern`, `socketio`, `react`, `nodejs`, `mongodb`, `real-time`, `codemirror`
- **Screenshots**: run the app, take 2-3 screenshots, put them in a `docs/` folder and embed them in `README.md` with `![screenshot](docs/room.png)`
- **Live demo link**: deploy the backend to Render/Railway and the frontend to Vercel, then add the link to the About panel

## Everyday workflow after the first push

```bash
git add .
git commit -m "Describe what you changed"
git push
```

## Two repos, two pushes

If you downloaded both CodeSync and LiveBid, repeat this process in each project folder with the respective repo names (`codesync` and `livebid`) - they are independent projects and belong in separate repositories.
