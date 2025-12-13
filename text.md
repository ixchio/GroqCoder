

## 🚀 Quick Copy-Paste Setup

```powershell
cd "C:\Users\Dan Ong'udi\Docker Projects\deepsite"

git init
git checkout -b main

git remote add origin https://huggingface.co/spaces/ongudidan/deepsite-v2

git add .
git commit -m "Initial DeepSite v2 upload"

git push origin main --force
```

👉 When prompted:

* **Username** → `ongudidan`
* **Password** → your **Hugging Face access token** (not your Hugging Face password).

---

## 📖 Documentation: Connecting Local Repo to Hugging Face Space

### 1. Navigate to Your Project Folder

Move into your project directory:

```powershell
cd "C:\Users\Dan Ong'udi\Docker Projects\deepsite"
```

### 2. Initialize Git Repository

If this is a fresh project:

```powershell
git init
git checkout -b main
```

This creates a new Git repository and ensures you’re working on the `main` branch.

### 3. Add Hugging Face Space as Remote

Connect your local repository to the Hugging Face Space:

```powershell
git remote add origin https://huggingface.co/spaces/ongudidan/deepsite-v2
```

> 🔑 Note: This uses a clean HTTPS URL (no token in the remote).

### 4. Stage and Commit Files

Add all project files and create your first commit:

```powershell
git add .
git commit -m "Initial DeepSite v2 upload"
```

### 5. Push to Hugging Face

Push your code to the Space:

```powershell
git push origin main --force
```

You will be prompted for credentials:

* **Username** → your Hugging Face username (`ongudidan`).
* **Password** → your Hugging Face **access token** (generated at [HF settings](https://huggingface.co/settings/tokens)).

---

✅ After a successful push, Hugging Face will build and deploy your Space automatically.

---
