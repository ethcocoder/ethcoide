import { CompletionResult, EditResult, ExplanationResult, ChatResponse } from '../types/ipc-messages';
export declare class AIService {
    private apiKey;
    private isInitialized;
    initialize(apiKey: string): Promise<void>;
    generateCompletion(context: any): Promise<CompletionResult>;
    editCode(instruction: string, code: string): Promise<EditResult>;
    explainCode(code: string): Promise<ExplanationResult>;
    chatWithAI(message: string, context: any): Promise<ChatResponse>;
    isReady(): boolean;
    getApiKeyStatus(): 'not-set' | 'set' | 'invalid';
}
//# sourceMappingURL=gemini-client.d.ts.map