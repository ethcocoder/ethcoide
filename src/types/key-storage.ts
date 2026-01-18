/**
 * Interface for secure API key storage operations
 */
export interface IKeyStorageService {
  /**
   * Stores an API key securely in the OS credential storage
   */
  setApiKey(keyName: string, apiKey: string): Promise<void>;

  /**
   * Retrieves an API key from secure storage
   */
  getApiKey(keyName: string): Promise<string | null>;

  /**
   * Deletes an API key from secure storage
   */
  deleteApiKey(keyName: string): Promise<boolean>;

  /**
   * Lists all stored API key names for this service
   */
  listApiKeys(): Promise<string[]>;

  /**
   * Checks if an API key exists in storage
   */
  hasApiKey(keyName: string): Promise<boolean>;

  /**
   * Updates an existing API key or creates a new one
   */
  updateApiKey(keyName: string, apiKey: string): Promise<void>;

  /**
   * Clears all API keys for this service
   */
  clearAllApiKeys(): Promise<void>;
}

/**
 * Error types for key storage operations
 */
export class KeyStorageError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly keyName?: string
  ) {
    super(message);
    this.name = 'KeyStorageError';
  }
}

/**
 * Configuration for key storage service
 */
export interface KeyStorageConfig {
  serviceName: string;
  enableLogging?: boolean;
}

/**
 * Credential information returned by listing operations
 */
export interface CredentialInfo {
  account: string;
  service: string;
}