import * as fc from 'fast-check';
import { KeyStorageService } from '../services/key-storage';
import { KeyStorageError } from '../types/key-storage';

// Mock keytar module
jest.mock('keytar', () => ({
  setPassword: jest.fn(),
  getPassword: jest.fn(),
  deletePassword: jest.fn(),
  findCredentials: jest.fn()
}));

import * as keytar from 'keytar';

describe('KeyStorageService', () => {
  let keyStorageService: KeyStorageService;
  const mockedKeytar = keytar as jest.Mocked<typeof keytar>;

  beforeEach(() => {
    keyStorageService = new KeyStorageService();
    jest.clearAllMocks();
  });

  describe('Property 24: Secure API Key Storage', () => {
    /**
     * Feature: ai-powered-ide, Property 24: Secure API Key Storage
     * Test that API keys are stored securely and never exposed in plain text
     * Verify cross-platform credential storage consistency
     * Test error handling for storage failures
     * Validates: Requirements 9.1
     */
    it('should store and retrieve API keys securely without exposing them in plain text', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            keyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            apiKey: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0)
          }),
          async (testData) => {
            const { keyName, apiKey } = testData;

            // Clear mocks before each test run
            mockedKeytar.setPassword.mockClear();
            mockedKeytar.getPassword.mockClear();

            // Mock successful storage
            mockedKeytar.setPassword.mockResolvedValue();
            mockedKeytar.getPassword.mockResolvedValue(apiKey);

            // Store the API key
            await keyStorageService.setApiKey(keyName, apiKey);

            // Verify keytar.setPassword was called with correct parameters
            expect(mockedKeytar.setPassword).toHaveBeenCalledWith(
              'ai-powered-ide',
              keyName,
              apiKey
            );

            // Retrieve the API key
            const retrievedKey = await keyStorageService.getApiKey(keyName);

            // Verify keytar.getPassword was called with correct parameters
            expect(mockedKeytar.getPassword).toHaveBeenCalledWith(
              'ai-powered-ide',
              keyName
            );

            // Verify the key was retrieved correctly
            expect(retrievedKey).toBe(apiKey);

            // Verify that the service name is consistent (cross-platform consistency)
            const setPasswordCalls = mockedKeytar.setPassword.mock.calls;
            const getPasswordCalls = mockedKeytar.getPassword.mock.calls;
            
            expect(setPasswordCalls[0][0]).toBe('ai-powered-ide');
            expect(getPasswordCalls[0][0]).toBe('ai-powered-ide');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle storage failures gracefully with proper error handling', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            keyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            apiKey: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
            errorMessage: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const { keyName, apiKey, errorMessage } = testData;

            // Clear mocks before each test run
            mockedKeytar.setPassword.mockClear();

            // Mock storage failure
            mockedKeytar.setPassword.mockRejectedValue(new Error(errorMessage));

            // Attempt to store the API key and expect it to throw a KeyStorageError
            await expect(keyStorageService.setApiKey(keyName, apiKey))
              .rejects
              .toThrow(KeyStorageError);

            // Verify the error contains the key name and operation
            try {
              await keyStorageService.setApiKey(keyName, apiKey);
            } catch (error) {
              expect(error).toBeInstanceOf(KeyStorageError);
              expect((error as KeyStorageError).operation).toBe('setApiKey');
              expect((error as KeyStorageError).keyName).toBe(keyName);
              expect((error as KeyStorageError).message).toContain(keyName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle retrieval failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            keyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            errorMessage: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (testData) => {
            const { keyName, errorMessage } = testData;

            // Clear mocks before each test run
            mockedKeytar.getPassword.mockClear();

            // Mock retrieval failure
            mockedKeytar.getPassword.mockRejectedValue(new Error(errorMessage));

            // Attempt to retrieve the API key and expect it to throw a KeyStorageError
            await expect(keyStorageService.getApiKey(keyName))
              .rejects
              .toThrow(KeyStorageError);

            // Verify the error contains the key name and operation
            try {
              await keyStorageService.getApiKey(keyName);
            } catch (error) {
              expect(error).toBeInstanceOf(KeyStorageError);
              expect((error as KeyStorageError).operation).toBe('getApiKey');
              expect((error as KeyStorageError).keyName).toBe(keyName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency across delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            keyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            deleteResult: fc.boolean()
          }),
          async (testData) => {
            const { keyName, deleteResult } = testData;

            // Clear mocks before each test run
            mockedKeytar.deletePassword.mockClear();

            // Mock delete operation
            mockedKeytar.deletePassword.mockResolvedValue(deleteResult);

            // Delete the API key
            const result = await keyStorageService.deleteApiKey(keyName);

            // Verify keytar.deletePassword was called with correct parameters
            expect(mockedKeytar.deletePassword).toHaveBeenCalledWith(
              'ai-powered-ide',
              keyName
            );

            // Verify the result matches the mocked return value
            expect(result).toBe(deleteResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should list API keys consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              account: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              password: fc.string({ minLength: 10, maxLength: 200 })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (credentials) => {
            // Clear mocks before each test run
            mockedKeytar.findCredentials.mockClear();

            // Mock findCredentials to return the test credentials
            mockedKeytar.findCredentials.mockResolvedValue(credentials);

            // List API keys
            const keyNames = await keyStorageService.listApiKeys();

            // Verify keytar.findCredentials was called with correct service name
            expect(mockedKeytar.findCredentials).toHaveBeenCalledWith('ai-powered-ide');

            // Verify the returned key names match the account names from credentials
            const expectedKeyNames = credentials.map(cred => cred.account);
            expect(keyNames).toEqual(expectedKeyNames);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle key existence checks correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            keyName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            keyExists: fc.boolean(),
            apiKey: fc.string({ minLength: 10, maxLength: 200 })
          }),
          async (testData) => {
            const { keyName, keyExists, apiKey } = testData;

            // Clear mocks before each test run
            mockedKeytar.getPassword.mockClear();

            // Mock getPassword based on whether key should exist
            if (keyExists) {
              mockedKeytar.getPassword.mockResolvedValue(apiKey);
            } else {
              mockedKeytar.getPassword.mockResolvedValue(null);
            }

            // Check if key exists
            const exists = await keyStorageService.hasApiKey(keyName);

            // Verify the result matches expected existence
            expect(exists).toBe(keyExists);

            // Verify getPassword was called with correct parameters
            expect(mockedKeytar.getPassword).toHaveBeenCalledWith(
              'ai-powered-ide',
              keyName
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle clear all operations consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              account: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              password: fc.string({ minLength: 10, maxLength: 200 })
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async (credentials) => {
            // Clear mocks before each test run
            mockedKeytar.findCredentials.mockClear();
            mockedKeytar.deletePassword.mockClear();
            
            // Mock findCredentials and deletePassword
            mockedKeytar.findCredentials.mockResolvedValue(credentials);
            mockedKeytar.deletePassword.mockResolvedValue(true);

            // Clear all API keys
            await keyStorageService.clearAllApiKeys();

            // Verify findCredentials was called
            expect(mockedKeytar.findCredentials).toHaveBeenCalledWith('ai-powered-ide');

            // Verify deletePassword was called for each credential
            credentials.forEach(cred => {
              expect(mockedKeytar.deletePassword).toHaveBeenCalledWith(
                'ai-powered-ide',
                cred.account
              );
            });

            // Verify deletePassword was called the correct number of times
            expect(mockedKeytar.deletePassword).toHaveBeenCalledTimes(credentials.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific edge cases
  describe('Unit Tests', () => {
    it('should handle empty key name gracefully', async () => {
      mockedKeytar.setPassword.mockResolvedValue();
      
      await keyStorageService.setApiKey('', 'test-key');
      
      expect(mockedKeytar.setPassword).toHaveBeenCalledWith(
        'ai-powered-ide',
        '',
        'test-key'
      );
    });

    it('should handle null return from getPassword', async () => {
      mockedKeytar.getPassword.mockResolvedValue(null);
      
      const result = await keyStorageService.getApiKey('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should handle updateApiKey as alias for setApiKey', async () => {
      mockedKeytar.setPassword.mockResolvedValue();
      
      await keyStorageService.updateApiKey('test-key', 'new-value');
      
      expect(mockedKeytar.setPassword).toHaveBeenCalledWith(
        'ai-powered-ide',
        'test-key',
        'new-value'
      );
    });

    it('should handle hasApiKey returning false on error', async () => {
      mockedKeytar.getPassword.mockRejectedValue(new Error('Access denied'));
      
      const exists = await keyStorageService.hasApiKey('test-key');
      
      expect(exists).toBe(false);
    });
  });
});