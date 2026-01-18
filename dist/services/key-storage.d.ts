import { IKeyStorageService } from '../types/key-storage';
/**
 * Service for secure storage of API keys using OS-level credential storage
 * Supports Windows Credential Manager, macOS Keychain, and Linux libsecret/keyring
 */
export declare class KeyStorageService implements IKeyStorageService {
    private static readonly SERVICE_NAME;
    /**
     * Stores an API key securely in the OS credential storage
     * @param keyName - Identifier for the API key (e.g., 'gemini-api-key')
     * @param apiKey - The API key to store securely
     * @throws Error if storage operation fails
     */
    setApiKey(keyName: string, apiKey: string): Promise<void>;
    /**
     * Retrieves an API key from secure storage
     * @param keyName - Identifier for the API key
     * @returns The API key if found, null if not found
     * @throws Error if retrieval operation fails
     */
    getApiKey(keyName: string): Promise<string | null>;
    /**
     * Deletes an API key from secure storage
     * @param keyName - Identifier for the API key to delete
     * @returns true if key was deleted, false if key was not found
     * @throws Error if deletion operation fails
     */
    deleteApiKey(keyName: string): Promise<boolean>;
    /**
     * Lists all stored API key names for this service
     * @returns Array of key names
     * @throws Error if listing operation fails
     */
    listApiKeys(): Promise<string[]>;
    /**
     * Checks if an API key exists in storage
     * @param keyName - Identifier for the API key
     * @returns true if key exists, false otherwise
     */
    hasApiKey(keyName: string): Promise<boolean>;
    /**
     * Updates an existing API key or creates a new one
     * @param keyName - Identifier for the API key
     * @param apiKey - The new API key value
     * @throws Error if update operation fails
     */
    updateApiKey(keyName: string, apiKey: string): Promise<void>;
    /**
     * Clears all API keys for this service
     * @throws Error if clear operation fails
     */
    clearAllApiKeys(): Promise<void>;
}
export declare const keyStorageService: KeyStorageService;
//# sourceMappingURL=key-storage.d.ts.map