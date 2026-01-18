// Test setup file
import 'jest-environment-jsdom';

// Mock window.electronAPI for tests
(global as any).window = {
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
(global as any).self = {
  MonacoEnvironment: {}
};