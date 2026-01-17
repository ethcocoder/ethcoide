# roadmap.md

## Phase 0 – Preparation (Desktop Focus)

* Learn Electron fundamentals (main vs renderer)
* Understand IPC (Inter-Process Communication)
* Learn Monaco Editor APIs
* Understand Gemini API (Flash models, free tier)
* Set up Git repository

## Phase 1 – Desktop Application Shell

* Initialize Electron app
* Create main process (window lifecycle)
* Create preload script (secure IPC bridge)
* Configure auto-reload for development
* Native menu bar (File, Edit, View, AI)

## Phase 2 – Code Editor Integration

* Integrate Monaco Editor in renderer
* Syntax highlighting
* Multiple file tabs
* File open/save dialogs (native)
* Load entire project folder

## Phase 3 – File System & Project Management

* Read/write files using Node.js (fs)
* Project explorer tree
* Track active file
* Watch file changes

## Phase 4 – Gemini API Integration

* Create Gemini API key (Google AI Studio)
* Desktop-safe API wrapper
* Prompt templates
* Rate limit & error handling

## Phase 5 – Cursor-like AI Features

* Inline AI code completion
* Edit selected code via instruction
* Explain code popup
* AI chat panel (desktop dock)

## Phase 6 – Project Context Engine

* Collect context from local files
* Limit context size (token-safe)
* Cache summaries on disk
* Dependency detection

## Phase 7 – Advanced Editing

* Multi-file refactoring
* Symbol renaming across files
* Undo/redo AI changes

## Phase 8 – Desktop UX & Performance

* Keyboard shortcuts
* Native dialogs & notifications
* Performance optimization
* Token usage optimization

## Phase 9 – Packaging & Distribution

* Build installers (Windows / Linux / macOS)
* Code signing (optional)
* Versioning & updates

---

# task.md

## Desktop Setup

* [ ] Initialize Electron project
* [ ] Configure preload.js securely
* [ ] Create IPC handlers
* [ ] Native menu integration

## Editor Tasks

* [ ] Monaco Editor setup
* [ ] File tabs
* [ ] Cursor & selection tracking
* [ ] Editor commands

## File System Tasks

* [ ] Project folder picker
* [ ] File explorer tree
* [ ] Save & reload files

## Gemini Tasks

* [ ] Gemini API client (Node)
* [ ] Secure local API key storage
* [ ] Prompt templates
* [ ] Rate limit handling

## AI Feature Tasks

* [ ] Inline completion
* [ ] Selection-based edit
* [ ] Chat panel
* [ ] Explain code

## Context Tasks

* [ ] Active file context
* [ ] Related file context
* [ ] Context trimming

## Advanced Tasks

* [ ] Multi-file edits
* [ ] Refactor commands
* [ ] AI undo history

## Release Tasks

* [ ] Desktop packaging
* [ ] Testing
* [ ] Final documentation

---

# structure.md

## Desktop Project Structure

```
/ai-ide
 ├── /electron
 │   ├── main.js           # Electron main process
 │   ├── preload.js        # Secure IPC bridge
 │   ├── menu.js           # Native menus
 │
 ├── /renderer
 │   ├── index.html
 │   ├── editor.js         # Monaco Editor
 │   ├── ui.js             # Panels & layout
 │   ├── styles.css
 │
 ├── /ai
 │   ├── geminiClient.js   # Gemini API wrapper
 │   ├── prompts.js        # Prompt templates
 │   └── contextEngine.js
 │
 ├── /services
 │   ├── fileService.js    # Local FS access
 │   ├── projectService.js
 │
 ├── /utils
 │   ├── tokenLimiter.js
 │   └── logger.js
 │
 ├── package.json
 ├── README.md
 └── documentation.md
```

---

# documentation.md

## Overview

This is a **desktop AI-powered IDE** inspired by Cursor, built using Electron and Monaco Editor, with Gemini API as the AI engine.

## Platform

* Windows
* Linux
* macOS

## Tech Stack

* Electron (desktop runtime)
* Monaco Editor (code editor)
* Node.js (local backend)
* Gemini API (AI engine)

## Core Features

* Inline AI code completion
* Edit code using natural language
* Project-aware AI chat
* Multi-file refactoring

## Gemini API Usage

* Uses Gemini Flash / Flash-Lite
* Free tier (no billing attached)
* Local context only

## Security Model

* API key stored locally
* All file access is local
* No cloud sync

## Limitations

* Free-tier rate limits
* No plugin system (v1)

## Future Roadmap

* Plugin support
* Local embeddings
* Team collaboration

---

**Author:** Ethco Coder
