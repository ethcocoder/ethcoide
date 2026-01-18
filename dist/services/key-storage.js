"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyStorageService = exports.KeyStorageService = void 0;
const keytar = __importStar(require("keytar"));
const key_storage_1 = require("../types/key-storage");
/**
 * Service for secure storage of API keys using OS-level credential storage
 * Supports Windows Credential Manager, macOS Keychain, and Linux libsecret/keyring
 */
class KeyStorageService {
    /**
     * Stores an API key securely in the OS credential storage
     * @param keyName - Identifier for the API key (e.g., 'gemini-api-key')
     * @param apiKey - The API key to store securely
     * @throws Error if storage operation fails
     */
    async setApiKey(keyName, apiKey) {
        try {
            await keytar.setPassword(KeyStorageService.SERVICE_NAME, keyName, apiKey);
        }
        catch (error) {
            throw new key_storage_1.KeyStorageError(`Failed to store API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`, 'setApiKey', keyName);
        }
    }
    /**
     * Retrieves an API key from secure storage
     * @param keyName - Identifier for the API key
     * @returns The API key if found, null if not found
     * @throws Error if retrieval operation fails
     */
    async getApiKey(keyName) {
        try {
            return await keytar.getPassword(KeyStorageService.SERVICE_NAME, keyName);
        }
        catch (error) {
            throw new key_storage_1.KeyStorageError(`Failed to retrieve API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`, 'getApiKey', keyName);
        }
    }
    /**
     * Deletes an API key from secure storage
     * @param keyName - Identifier for the API key to delete
     * @returns true if key was deleted, false if key was not found
     * @throws Error if deletion operation fails
     */
    async deleteApiKey(keyName) {
        try {
            return await keytar.deletePassword(KeyStorageService.SERVICE_NAME, keyName);
        }
        catch (error) {
            throw new key_storage_1.KeyStorageError(`Failed to delete API key '${keyName}': ${error instanceof Error ? error.message : 'Unknown error'}`, 'deleteApiKey', keyName);
        }
    }
    /**
     * Lists all stored API key names for this service
     * @returns Array of key names
     * @throws Error if listing operation fails
     */
    async listApiKeys() {
        try {
            const credentials = await keytar.findCredentials(KeyStorageService.SERVICE_NAME);
            return credentials.map(cred => cred.account);
        }
        catch (error) {
            throw new key_storage_1.KeyStorageError(`Failed to list API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, 'listApiKeys');
        }
    }
    /**
     * Checks if an API key exists in storage
     * @param keyName - Identifier for the API key
     * @returns true if key exists, false otherwise
     */
    async hasApiKey(keyName) {
        try {
            const key = await this.getApiKey(keyName);
            return key !== null;
        }
        catch (error) {
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
    async updateApiKey(keyName, apiKey) {
        // keytar.setPassword will overwrite existing keys, so this is the same as setApiKey
        await this.setApiKey(keyName, apiKey);
    }
    /**
     * Clears all API keys for this service
     * @throws Error if clear operation fails
     */
    async clearAllApiKeys() {
        try {
            const keyNames = await this.listApiKeys();
            const deletePromises = keyNames.map(keyName => this.deleteApiKey(keyName));
            await Promise.all(deletePromises);
        }
        catch (error) {
            throw new key_storage_1.KeyStorageError(`Failed to clear all API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, 'clearAllApiKeys');
        }
    }
}
exports.KeyStorageService = KeyStorageService;
KeyStorageService.SERVICE_NAME = 'ai-powered-ide';
// Export a singleton instance for convenience
exports.keyStorageService = new KeyStorageService();
//# sourceMappingURL=key-storage.js.map