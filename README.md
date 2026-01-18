# AI-Powered IDE

A revolutionary desktop IDE with AI assistance powered by Gemini API, built with Electron and Monaco Editor.

## 🚀 Features

- **Native Desktop Experience**: Cross-platform support for Windows, Linux, and macOS
- **Secure Architecture**: IPC communication with context isolation and secure preload scripts
- **AI Integration Ready**: Built-in support for Gemini API integration
- **Modern Tech Stack**: TypeScript, Electron, Monaco Editor
- **Property-Based Testing**: Comprehensive testing with fast-check library

## 📋 Current Status

### ✅ Completed Features

1. **Electron Application Foundation**
   - TypeScript Electron project setup
   - Main process with window lifecycle management
   - Secure preload script for IPC communication
   - Native menu bar (File, Edit, View, AI)
   - Comprehensive property-based tests for IPC security

### 🔄 In Progress

- Monaco Editor Integration
- File System and Project Management
- AI Features Implementation

## 🛠️ Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start

# Run tests
npm test

# Development mode with auto-reload
npm run dev
```

### Project Structure

```
src/
├── main/
│   ├── main.ts              # Electron main process
│   ├── menu.ts              # Native menus
│   └── ipc-handlers.ts      # IPC message handlers
├── preload/
│   └── preload.ts           # Secure IPC bridge
├── renderer/
│   └── index.html           # UI interface
├── services/
│   ├── file-service.ts      # File system operations
│   ├── project-service.ts   # Project management
├── ai/
│   └── gemini-client.ts     # Gemini API wrapper
├── types/
│   └── ipc-messages.ts      # IPC contract types
└── __tests__/
    └── ipc-security.test.ts # Property-based tests
```

## 🔒 Security

- **Context Isolation**: Renderer process runs in isolated context
- **Secure IPC**: All communication validated through preload script
- **No Direct Node.js Access**: Renderer cannot access Node.js APIs directly
- **API Key Security**: Credentials stored using OS-level secure storage

## 🧪 Testing

The project uses a dual testing approach:

- **Property-Based Testing**: Using fast-check for comprehensive input coverage
- **Unit Testing**: Jest for specific functionality testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📖 Architecture

The IDE follows Electron's multi-process architecture with enhanced security:

- **Main Process**: Handles application lifecycle, file operations, AI API calls
- **Renderer Process**: Manages UI, Monaco Editor, user interactions
- **Preload Script**: Secure bridge between main and renderer processes

## 🎯 Next Steps

1. Monaco Editor Integration
2. File System and Project Management
3. Gemini API Integration
4. AI-Powered Code Features
5. Context Engine Implementation

## 📄 License

MIT License - see LICENSE file for details.

## 👨‍💻 Author

Ethco Coder