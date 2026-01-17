# Implementation Plan: AI-Powered IDE (MVP v1)

## Overview

This implementation plan focuses on building a realistic MVP that delivers core AI-powered editing capabilities. The v1 scope includes: local project opening, Monaco editor integration, file tabs, inline AI completion, natural language code editing, and AI chat for the current file. Advanced features like debugging, Git integration, and cross-file refactoring are deferred to future versions.

## Tasks

- [ ] 1. Electron Application Foundation
  - Set up TypeScript Electron project with proper build configuration
  - Create main process with window lifecycle management
  - Implement secure preload script for IPC communication
  - Add native menu bar with File, Edit, View, and AI menus
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.1 Write property test for IPC security
  - **Property 1: IPC Security and Communication**
  - **Validates: Requirements 1.3**

- [ ] 2. Monaco Editor Integration
  - [ ] 2.1 Integrate Monaco Editor in renderer process
    - Set up Monaco Editor with TypeScript configuration
    - Implement syntax highlighting for common file types
    - Configure editor themes and basic settings
    - _Requirements: 2.1, 2.2_

  - [ ] 2.2 Write unit test for syntax highlighting
    - Test syntax highlighting for common file types
    - Verify theme application and color schemes
    - **Validates: Requirements 2.2**

  - [ ] 2.3 Implement file tab system
    - Create tab management for multiple open files
    - Add tab switching and closing functionality
    - Track active tab state across the application
    - _Requirements: 2.3, 2.4_

  - [ ] 2.4 Write unit test for tab management
    - Test tab opening, closing, and switching
    - Verify active tab state tracking
    - **Validates: Requirements 2.3, 2.4**

- [ ] 3. File System and Project Management
  - [ ] 3.1 Implement core file operations
    - Create FileSystemService with read/write operations
    - Add native file open/save dialogs
    - Implement file watching for external changes
    - _Requirements: 3.1, 2.5_

  - [ ] 3.2 Write property test for file operations
    - **Property 6: File System Operation Consistency**
    - **Validates: Requirements 3.1, 3.3, 3.5**

  - [ ] 3.3 Build project explorer
    - Create hierarchical tree view of project structure
    - Implement project folder selection and loading
    - Add file creation, deletion, and renaming
    - _Requirements: 2.6, 3.2, 3.5_

  - [ ] 3.4 Write property test for project structure
    - **Property 5: Project Structure Loading**
    - **Validates: Requirements 2.6**

- [ ] 4. Checkpoint - Basic IDE functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Secure API Key Management
  - [ ] 5.1 Implement OS-level secure storage
    - Use keytar library for cross-platform credential storage
    - Windows: Credential Manager integration
    - macOS: Keychain integration  
    - Linux: libsecret/keyring integration
    - _Requirements: 9.1_

  - [ ] 5.2 Write property test for secure storage
    - **Property 24: Secure API Key Storage**
    - **Validates: Requirements 9.1**

- [ ] 6. Gemini API Integration
  - [ ] 6.1 Create Gemini API client
    - Implement secure API wrapper with authentication
    - Add rate limiting and error handling
    - Create prompt templates for different AI interactions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 6.2 Write property test for API authentication
    - **Property 9: API Authentication Consistency**
    - **Validates: Requirements 4.2**

  - [ ] 6.3 Write property test for rate limiting
    - **Property 10: API Rate Limiting and Error Handling**
    - **Validates: Requirements 4.3**

  - [ ] 6.4 Implement Change Executor (Critical Architecture)
    - Create ChangeExecutor interface for applying AI changes
    - Add change preview functionality
    - Implement rollback/undo system for AI changes
    - Add manual apply UX: "Apply", "Reject", "Undo last AI change"
    - AI edits are never auto-applied - user must explicitly approve
    - _Requirements: 7.3_

  - [ ] 6.5 Write property test for change undo/redo
    - **Property 20: AI Change Undo/Redo**
    - **Validates: Requirements 7.3**

- [ ] 7. Context Engine with Hard Limits
  - [ ] 7.1 Build deterministic context collection
    - Max files per request: 5
    - Max lines per file: 200
    - Always include: current file, imports of current file
    - Never include: node_modules, build output, minified files
    - _Requirements: 6.1, 6.2_

  - [ ] 7.2 Write property test for token management
    - **Property 15: Context Collection and Token Management**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 7.3 Implement context caching
    - Cache context summaries locally for performance
    - Add cache invalidation when files change
    - _Requirements: 6.3, 6.5_

  - [ ] 7.4 Write property test for context caching
    - **Property 16: Context Caching and Retrieval**
    - **Validates: Requirements 6.3, 6.5**

- [ ] 8. Core AI Features
  - [ ] 8.1 Implement inline code completion with throttling
    - Real-time AI suggestions as user types
    - Debounce AI requests (300-500ms delay)
    - Cancel in-flight requests on cursor move
    - Ignore completions when editor is dirty
    - Integration with Monaco Editor's completion provider
    - Context-aware completions using current file
    - _Requirements: 5.1_

  - [ ] 8.2 Write unit test for code completion UI
    - Test completion display and selection
    - Verify throttling and cancellation behavior
    - **Validates: Requirements 5.1**

  - [ ] 8.3 Build natural language code editing
    - Select code and edit via natural language instructions
    - Preview changes before applying
    - Integration with Change Executor
    - _Requirements: 5.2_

  - [ ] 8.4 Write property test for natural language editing
    - **Property 13: Natural Language Code Editing**
    - **Validates: Requirements 5.2**

  - [ ] 8.5 Create AI chat panel
    - Chat interface for current file assistance
    - Context-aware responses using current file
    - Chat history and session management
    - _Requirements: 5.3_

- [ ] 9. IPC Message Contracts
  - [ ] 9.1 Define strict IPC message types
    - Create TypeScript types for all IPC messages
    - Implement message validation in preload script
    - Add error handling for malformed messages
    - _Requirements: 1.3_

  - [ ] 9.2 Write property test for IPC validation
    - **Property 1: IPC Security and Communication**
    - **Validates: Requirements 1.3**

- [ ] 10. Error Handling and Recovery
  - [ ] 10.1 Implement comprehensive error handling
    - File system error recovery
    - AI API error handling with user feedback
    - Application crash prevention and reporting
    - _Requirements: 4.5, 12.7_

  - [ ] 10.2 Write property test for error messaging
    - **Property 34: Helpful Error Messaging**
    - **Validates: Requirements 12.7**

  - [ ] 10.3 Add auto-save and recovery
    - Automatic saving of unsaved changes every 30 seconds
    - Recovery of work after unexpected shutdowns
    - _Requirements: 1.5_

  - [ ] 10.4 Write property test for resource cleanup
    - **Property 2: Resource Cleanup on Shutdown**
    - **Validates: Requirements 1.5**

- [ ] 11. Final Integration and Polish
  - [ ] 11.1 Wire all components together
    - Connect file system, editor, and AI services
    - Ensure proper data flow between components
    - Add loading states and user feedback
    - _Requirements: All core requirements_

  - [ ] 11.2 Write integration tests
    - Test end-to-end workflows
    - Verify cross-component communication
    - Test error scenarios and recovery

- [ ] 12. Final checkpoint - Complete MVP
  - Ensure all tests pass, ask the user if questions arise.

## Notes

### V1 MVP Scope (REALISTIC)
✅ **Included in v1:**
- Open local project
- Monaco editor with syntax highlighting
- File tabs and basic file operations
- Inline AI completion
- "Edit selected code" with natural language
- AI chat for current file
- Secure API key storage
- Basic error handling

❌ **Deferred to future versions:**
- DebugService
- Full Git integration  
- Cross-file refactoring
- Project templates
- Formatting + linting engine
- Large-scale navigation (go-to-definition)
- Terminal integration
- Extension system

### Key Architecture Decisions
- **Change Executor**: Critical abstraction for AI change management
- **Hard Context Limits**: Deterministic rules prevent runaway token usage
- **OS-Level Security**: Explicit credential storage per platform
- **Strict IPC Contracts**: Typed message validation prevents IPC sprawl

### Testing Strategy
- Tasks are comprehensive and include property-based testing from the start
- Each property test runs minimum 100 iterations
- Property tests validate universal correctness properties
- Unit tests handle specific examples and edge cases
- Integration tests verify end-to-end workflows

### File Structure
```
src/
├── main/
│   ├── main.ts              # Electron main process
│   ├── menu.ts              # Native menus
│   └── ipc-handlers.ts      # IPC message handlers
├── renderer/
│   ├── index.html
│   ├── editor.ts            # Monaco Editor integration
│   ├── tabs.ts              # Tab management
│   └── ui.ts                # UI components
├── services/
│   ├── file-service.ts      # File system operations
│   ├── project-service.ts   # Project management
│   └── change-executor.ts   # AI change management
├── ai/
│   ├── gemini-client.ts     # Gemini API wrapper
│   ├── context-engine.ts    # Context collection
│   └── prompts.ts           # Prompt templates
├── security/
│   └── key-storage.ts       # Secure credential storage
└── types/
    ├── ipc-messages.ts      # IPC contract types
    └── common.ts            # Shared types
```