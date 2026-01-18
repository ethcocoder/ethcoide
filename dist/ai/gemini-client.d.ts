import { CompletionResult, EditResult, ExplanationResult, ChatResponse } from '../types/ipc-messages';
export declare class AIService {
    private genAI;
    private model;
    private apiKey;
    private isInitialized;
    private readonly modelName;
    private readonly maxRetries;
    private rateLimiter;
    private isOfflineMode;
    constructor();
    initialize(apiKey?: string): Promise<void>;
    private testApiKey;
    private retryWithBackoff;
    private isRetryableError;
    private delay;
    generateCompletion(context: any): Promise<CompletionResult>;
    editCode(instruction: string, code: string): Promise<EditResult>;
    explainCode(code: string): Promise<ExplanationResult>;
    chatWithAI(message: string, context: any): Promise<ChatResponse>;
    private buildPromptContext;
    private detectLanguageFromContext;
    private parseCompletionSuggestions;
    private parseEditResponse;
    private parseExplanationResponse;
    private parseChatResponse;
    private parseSections;
    private calculateConfidence;
    isReady(): boolean;
    getApiKeyStatus(): 'not-set' | 'set' | 'invalid';
    setApiKey(apiKey: string): Promise<void>;
    clearApiKey(): Promise<void>;
    /**
     * Get offline mode fallback responses
     */
    private getOfflineCompletion;
    private getOfflineEdit;
    private getOfflineExplanation;
    private getOfflineChat;
    /**
     * Get service status information
     */
    getServiceStatus(): {
        isInitialized: boolean;
        isOfflineMode: boolean;
        apiKeyStatus: 'not-set' | 'set' | 'invalid';
        rateLimiterStatus: any;
    };
    /**
     * Attempt to reconnect and exit offline mode
     */
    reconnect(): Promise<boolean>;
    /**
     * Check if service is in offline mode
     */
    isInOfflineMode(): boolean;
}
//# sourceMappingURL=gemini-client.d.ts.map