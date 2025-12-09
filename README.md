<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1b9J3vxjeaCHcGci8xR2QTDl5E0VLh6yB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and set:
   - `VITE_GEMINI_API_KEY` - Your Gemini API key (required)
   - `VITE_DATA_DIR` - Directory for saved projects (default: `./vibecode-projects`)

3. Run the app:
   ```bash
   npm run dev
   ```

## Features

### 🎨 Core Features
- **AI-Powered Code Generation** - Single or Multi-Agent modes
- **Monaco Editor** - Full VSCode-like editing experience
- **Live Preview** - Real-time preview with responsive viewport testing
- **Console Integration** - Capture and display console output
- **Project Templates** - Pre-built starter templates

### 💾 Project Management
- **Save Projects** - Persistently store your projects locally
- **Load Projects** - Browse and load saved projects
- **Auto-Save** - Automatic saving every 30 seconds
- **Import/Export** - Share projects as JSON files
- **Search & Tags** - Organize and find projects easily

### 🤖 Multi-Agent System
- **Coordinator** - Orchestrates the workflow
- **Architect** - Designs project structure
- **Frontend Developer** - Builds React components
- **Backend Developer** - Implements logic
- **Code Reviewer** - Ensures quality

### 📁 File Management
- **Create Files** - Add new files directly in the editor
- **Delete Files** - Remove unwanted files
- **Edit Files** - Full Monaco Editor integration
- **File Explorer** - VSCode-style file tree

## Configuration

Edit `.env.local` to customize:

```env
# Required: Your Gemini API key
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: Project storage location
VITE_DATA_DIR=./vibecode-projects

# Optional: Default AI provider
VITE_DEFAULT_PROVIDER=gemini

# Optional: Default model
VITE_DEFAULT_MODEL=gemini-2.0-flash-exp
```

## Storage

Projects are saved using browser LocalStorage. The `VITE_DATA_DIR` setting in `.env.local` is used for logging and reference, but actual storage is in the browser.

To clear all saved projects:
```javascript
// In browser console
localStorage.clear()
```
