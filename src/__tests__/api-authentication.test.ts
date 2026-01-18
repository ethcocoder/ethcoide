import * as fc from 'fast-check';
import { AIService } from '../ai/gemini-client';
import { keyStorageService } from '../services/key-storage';
import { AIError, AIErrorType } from '../ai/error-handler';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
  GenerationConfig: {}
}));

// Mock the key storage service
jest.mock('../services/key-storage', () => ({
  keyStorageService: {
    getApiKey: jest.fn(),
    setApiKey: jest.fn(),
    deleteApiKey: jest.fn()
  }
}));

import { GoogleGenerativeAI } from '@google/generative-ai';

describe('AIService API Authentication', () => {
  let aiService: AIService;
  const mockedGoogleAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
  const mockedKeyStorage = keyStorageService as jest.Mocked<typeof keyStorageService>;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('Property 9: API Authentication Consistency', () => {
    /**
     * Feature: ai-powered-ide, Property 9: API Authentication Consistency
     * Test that all API requests use stored credentials correctly
     * Verify authentication failure handling
     * Test credential refresh mechanisms
     * Validates: Requirements 4.2
     */
    it('should use stored credentials correctly for all API requests', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          apiKey: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          shouldStoreKey: fc.boolean()
        }),
        async (testData) => {
          const { apiKey, shouldStoreKey } = testData;

          // Clear mocks before each test run
          mockedGoogleAI.mockClear();
          mockedKeyStorage.getApiKey.mockClear();
          mockedKeyStorage.setApiKey.mockClear();

          // Mock key storage behavior
          if (shouldStoreKey) {
            mockedKeyStorage.getApiKey.mockResolvedValue(apiKey);
          } else {
            mockedKeyStorage.getApiKey.mockResolvedValue(null);
          }

          // Mock successful API response
          const mockModel = {
            generateContent: jest.fn().mockResolvedValue({
              response: { text: () => 'Hello' }
            })
          };
          
          mockedGoogleAI.mockImplementation((key: string) => ({
            apiKey: key,
            getGenerativeModel: jest.fn().mockReturnValue(mockModel),
            getGenerativeModelFromCachedContent: jest.fn()
          } as any));

          if (shouldStoreKey) {
            // Test initialization with stored key
            await aiService.initialize();

            // Verify GoogleGenerativeAI was called with the stored key
            expect(mockedGoogleAI).toHaveBeenCalledWith(apiKey);
            expect(mockedKeyStorage.getApiKey).toHaveBeenCalledWith('gemini-api-key');

            // Test that API requests use the authenticated model
            await aiService.generateCompletion({ currentFile: 'test.js' });
            expect(mockModel.generateContent).toHaveBeenCalled();
          } else {
            // Test initialization without stored key should fail
            await expect(aiService.initialize()).rejects.toThrow();
            expect(mockedKeyStorage.getApiKey).toHaveBeenCalledWith('gemini-api-key');
          }
        }
      ), { numRuns: 100 });
    });

    it('should handle authentication failures gracefully', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          apiKey: fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0),
          errorType: fc.constantFrom(
            'Invalid API key',
            'Authentication failed',
            'Unauthorized access',
            'API key expired'
          )
        }),
        async (testData) => {
          const { apiKey, errorType } = testData;

          // Clear mocks before each test run
          mockedGoogleAI.mockClear();
          mockedKeyStorage.getApiKey.mockClear();

          // Mock authentication failure
          const mockModel = {
            generateContent: jest.fn().mockRejectedValue(new Error(errorType))
          };
          
          mockedGoogleAI.mockImplementation((key: string) => ({
            apiKey: key,
            getGenerativeModel: jest.fn().mockReturnValue(mockModel),
            getGenerativeModelFromCachedContent: jest.fn()
          } as any));

          // Mock stored API key
          mockedKeyStorage.getApiKey.mockResolvedValue(apiKey);

          // Test that authentication failure is handled properly
          await expect(aiService.initialize()).rejects.toThrow(AIError);

          try {
            await aiService.initialize();
          } catch (error) {
            expect(error).toBeInstanceOf(AIError);
            expect((error as AIError).type).toBe(AIErrorType.AUTHENTICATION);
          }

          // Verify the service is not initialized after authentication failure
          expect(aiService.isReady()).toBe(false);
          expect(aiService.getApiKeyStatus()).toBe('not-set'); // API key is cleared on initialization failure
        }
      ), { numRuns: 100 });
    });
  });

  // Unit tests for specific authentication scenarios
  describe('Unit Tests', () => {
    it('should initialize without API key parameter when key is stored', async () => {
      const storedKey = 'stored-api-key-12345';
      
      mockedKeyStorage.getApiKey.mockResolvedValue(storedKey);
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'Hello' }
        })
      };
      
      mockedGoogleAI.mockImplementation((key: string) => ({
        apiKey: key,
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
        getGenerativeModelFromCachedContent: jest.fn()
      } as any));

      await aiService.initialize();

      expect(mockedKeyStorage.getApiKey).toHaveBeenCalledWith('gemini-api-key');
      expect(mockedGoogleAI).toHaveBeenCalledWith(storedKey);
      expect(aiService.isReady()).toBe(true);
    });

    it('should handle offline mode when authentication fails', async () => {
      const apiKey = 'invalid-key';
      
      mockedKeyStorage.getApiKey.mockResolvedValue(apiKey);
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('Invalid API key'))
      };
      
      mockedGoogleAI.mockImplementation((key: string) => ({
        apiKey: key,
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
        getGenerativeModelFromCachedContent: jest.fn()
      } as any));

      await expect(aiService.initialize()).rejects.toThrow(AIError);
      
      expect(aiService.isInOfflineMode()).toBe(true);
      expect(aiService.isReady()).toBe(false);
    });
  });
});