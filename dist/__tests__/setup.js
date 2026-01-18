"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file
require("jest-environment-jsdom");
// Mock window.electronAPI for tests
global.window = {
    electronAPI: {
        fileOperations: {
            readFile: jest.fn(),
            writeFile: jest.fn(),
            createFile: jest.fn(),
            deleteFile: jest.fn(),
            renameFile: jest.fn(),
            watchDirectory: jest.fn()
        },
        aiOperations: {
            generateCompletion: jest.fn(),
            editCode: jest.fn(),
            explainCode: jest.fn(),
            chatWithAI: jest.fn()
        },
        projectOperations: {
            loadProject: jest.fn(),
            createProject: jest.fn(),
            refreshProject: jest.fn()
        },
        system: {
            showOpenDialog: jest.fn(),
            showSaveDialog: jest.fn(),
            showMessageBox: jest.fn()
        },
        events: {
            onFileChanged: jest.fn(),
            onProjectChanged: jest.fn(),
            removeAllListeners: jest.fn()
        }
    },
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};
// Mock global self for Monaco Editor
global.self = {
    MonacoEnvironment: {}
};
//# sourceMappingURL=setup.js.map