"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyStorageError = void 0;
/**
 * Error types for key storage operations
 */
class KeyStorageError extends Error {
    constructor(message, operation, keyName) {
        super(message);
        this.operation = operation;
        this.keyName = keyName;
        this.name = 'KeyStorageError';
    }
}
exports.KeyStorageError = KeyStorageError;
//# sourceMappingURL=key-storage.js.map