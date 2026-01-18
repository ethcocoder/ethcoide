/**
 * Prompt templates for different AI interactions
 * These templates provide consistent and optimized prompts for various AI operations
 */
export interface PromptContext {
    currentFile?: string;
    selectedText?: string;
    cursorPosition?: {
        line: number;
        column: number;
    };
    surroundingCode?: string;
    projectContext?: {
        rootPath: string;
        summary: string;
        files?: string[];
        dependencies?: string[];
    };
    language?: string;
    framework?: string;
}
export declare class PromptTemplates {
    /**
     * Generate a code completion prompt
     */
    static codeCompletion(context: PromptContext): string;
    /**
     * Generate a code editing prompt
     */
    static codeEdit(instruction: string, code: string, context: PromptContext): string;
    /**
     * Generate a code explanation prompt
     */
    static codeExplanation(code: string, context: PromptContext): string;
    /**
     * Generate a chat conversation prompt
     */
    static chat(message: string, context: PromptContext, conversationHistory?: Array<{
        role: string;
        content: string;
    }>): string;
    /**
     * Generate a refactoring prompt
     */
    static refactoring(code: string, refactoringType: string, context: PromptContext): string;
    /**
     * Generate a debugging prompt
     */
    static debugging(code: string, error: string, context: PromptContext): string;
    /**
     * Generate a code review prompt
     */
    static codeReview(code: string, context: PromptContext): string;
    /**
     * Detect programming language from file extension
     */
    private static detectLanguage;
    /**
     * Estimate code complexity based on simple heuristics
     */
    private static estimateComplexity;
    /**
     * Create a context-aware prompt with project information
     */
    static withProjectContext(basePrompt: string, context: PromptContext): string;
}
//# sourceMappingURL=prompts.d.ts.map