import * as keytar from 'keytar';
import { IKeyStorageService, KeyStorageError } from '../types/key-storage';

/**
 * Service for secure storage of API keys using OS-level credential storage
 * Supports Windows Credential Manager, macOS Keychain, and Linux libsecret/keyring
 */
export class KeyStorageService implements IKeyStorageService {
  private static readonly SERVICE_NAME = 'ai-powered-ide';
  
  /**
   * Stores an API key securely in the OS credential storage
   * @param keyName - Identifier for the API key (e.g., 'gemini-api-key')
   * @param apiKey - The API key to store securely
   * @throws Error if storage operation fails
   */
  async setApiKey(keyName: string, apiKey: string): Promise<void> {
    try {
      await keytar.setPassword(KeyStorageService.SERVICE_NAME, keyName, apiKey);
    } catch (error) {
      throw new KeyStorageError(
        `Failed to store API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        'setApiKey',
        keyName
      );
    }
  }

  /**
   * Retrieves an API key from secure storage
   * @param keyName - Identifier for the API key
   * @returns The API key if found, null if not found
   * @throws Error if retrieval operation fails
   */
  async getApiKey(keyName: string): Promise<string | null> {
    try {
      return await keytar.getPassword(KeyStorageService.SERVICE_NAME, keyName);
    } catch (error) {
      throw new KeyStorageError(
        `Failed to retrieve API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getApiKey',
        keyName
      );
    }
  }

  /**
   * Deletes an API key from secure storage
   * @param keyName - Identifier for the API key to delete
   * @returns true if key was deleted, false if key was not found
   * @throws Error if deletion operation fails
   */
  async deleteApiKey(keyName: string): Promise<boolean> {
    try {
      return await keytar.deletePassword(KeyStorageService.SERVICE_NAME, keyName);
    } catch (error) {
      throw new KeyStorageError(
        `Failed to delete API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteApiKey',
        keyName
      );
    }
  }

  /**
   * Lists all stored API key names for this service
   * @returns Array of key names
   * @throws Error if listing operation fails
   */
  async listApiKeys(): Promise<string[]> {
    try {
      const credentials = await keytar.findCredentials(KeyStorageService.SERVICE_NAME);
      return credentials.map(cred => cred.account);
    } catch (error) {
      throw new KeyStorageError(
        `Failed to list API keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'listApiKeys'
      );
    }
  }

  /**
   * Checks if an API key exists in storage
   * @param keyName - Identifier for the API key
   * @returns true if key exists, false otherwise
   */
  async hasApiKey(keyName: string): Promise<boolean> {
    try {
      const key = await this.getApiKey(keyName);
      return key !== null;
    } catch (error) {
      // If there's an error retrieving, assume key doesn't exist
      return false;
    }
  }

  /**
   * Updates an existing API key or creates a new one
   * @param keyName - Identifier for the API key
   * @param apiKey - The new API key value
   * @throws Error if update operation fails
   */
  async updateApiKey(keyName: string, apiKey: string): Promise<void> {
    // keytar.setPassword will overwrite existing keys, so this is the same as setApiKey
    await this.setApiKey(keyName, apiKey);
  }

  /**
   * Clears all API keys for this service
   * @throws Error if clear operation fails
   */
  async clearAllApiKeys(): Promise<void> {
    try {
      const keyNames = await this.listApiKeys();
      const deletePromises = keyNames.map(keyName => this.deleteApiKey(keyName));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new KeyStorageError(
        `Failed to clear all API keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'clearAllApiKeys'
      );
    }
  }
}

// Export a singleton instance for convenience
export const keyStorageService = new KeyStorageService();