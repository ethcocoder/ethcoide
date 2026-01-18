"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const key_storage_1 = require("../services/key-storage");
const rate_limiter_1 = require("./rate-limiter");
const error_handler_1 = require("./error-handler");
const prompts_1 = require("./prompts");
class AIService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.apiKey = null;
        this.isInitialized = false;
        this.modelName = 'gemini-1.5-flash';
        this.maxRetries = 3;
        this.isOfflineMode = false;
        // Initialize rate limiter with 60 requests per minute (Gemini's typical limit)
        this.rateLimiter = new rate_limiter_1.RateLimiter(60);
    }
    async initialize(apiKey) {
        try {
            // If no API key provided, try to get from secure storage
            if (!apiKey) {
                const storedKey = await key_storage_1.keyStorageService.getApiKey('gemini-api-key');
                if (!storedKey) {
                    throw new Error('No API key found. Please configure your Gemini API key.');
                }
                apiKey = storedKey;
            }
            // Initialize Google Generative AI
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: this.modelName });
            this.apiKey = apiKey;
            // Test the API key with a simple request
            await this.testApiKey();
            this.isInitialized = true;
            this.isOfflineMode = false;
            console.log('AI Service initialized successfully with Gemini API');
        }
        catch (error) {
            this.isInitialized = false;
            this.genAI = null;
            this.model = null;
            this.apiKey = null;
            const aiError = error_handler_1.AIErrorHandler.handleError(error);
            if (error_handler_1.AIErrorHandler.shouldEnableOfflineMode(aiError)) {
                this.isOfflineMode = true;
                console.warn('AI Service entering offline mode due to:', aiError.message);
            }
            throw aiError;
        }
    }
    async testApiKey() {
        if (!this.model) {
            throw new Error('Model not initialized');
        }
        try {
            const result = await this.model.generateContent('Hello');
            if (!result.response) {
                throw new Error('Invalid API response');
            }
        }
        catch (error) {
            const aiError = error_handler_1.AIErrorHandler.handleError(error);
            throw new error_handler_1.AIError(`API key validation failed: ${aiError.message}`, error_handler_1.AIErrorType.AUTHENTICATION, error instanceof Error ? error : undefined);
        }
    }
    async retryWithBackoff(operation, retries = this.maxRetries) {
        let lastError = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Use rate limiter to queue the request
                return await this.rateLimiter.enqueue(operation);
            }
            catch (error) {
                lastError = error_handler_1.AIErrorHandler.handleError(error);
                // Don't retry if error is not retryable
                if (!lastError.retryable || attempt === retries) {
                    break;
                }
                // Calculate delay based on error type and attempt number
                const delay = error_handler_1.AIErrorHandler.getRetryDelay(lastError, attempt);
                console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`);
                await this.delay(delay);
            }
        }
        // If we get here, all retries failed
        if (lastError) {
            // Check if we should enable offline mode
            if (error_handler_1.AIErrorHandler.shouldEnableOfflineMode(lastError)) {
                this.isOfflineMode = true;
                console.warn('Enabling offline mode due to repeated failures:', lastError.message);
            }
            throw lastError;
        }
        throw new error_handler_1.AIError('Operation failed after all retries', error_handler_1.AIErrorType.UNKNOWN);
    }
    isRetryableError(error) {
        const aiError = error_handler_1.AIErrorHandler.handleError(error);
        return aiError.retryable;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async generateCompletion(context) {
        if (!this.isInitialized || !this.model) {
            throw new error_handler_1.AIError('AI Service not initialized. Please configure API key.', error_handler_1.AIErrorType.AUTHENTICATION);
        }
        if (this.isOfflineMode) {
            return this.getOfflineCompletion(context);
        }
        return this.retryWithBackoff(async () => {
            const prompt = prompts_1.PromptTemplates.codeCompletion(this.buildPromptContext(context));
            const generationConfig = {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            };
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = result.response;
            const text = response.text();
            // Parse suggestions from the response
            const suggestions = this.parseCompletionSuggestions(text);
            return {
                suggestions,
                confidence: this.calculateConfidence(response)
            };
        });
    }
    async editCode(instruction, code) {
        if (!this.isInitialized || !this.model) {
            throw new error_handler_1.AIError('AI Service not initialized. Please configure API key.', error_handler_1.AIErrorType.AUTHENTICATION);
        }
        if (this.isOfflineMode) {
            return this.getOfflineEdit(instruction, code);
        }
        return this.retryWithBackoff(async () => {
            const promptContext = this.buildPromptContext({ currentFile: 'current', selectedText: code });
            const prompt = prompts_1.PromptTemplates.codeEdit(instruction, code, promptContext);
            const generationConfig = {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 2048,
            };
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = result.response;
            const text = response.text();
            return this.parseEditResponse(text, code, instruction);
        });
    }
    async explainCode(code) {
        if (!this.isInitialized || !this.model) {
            throw new error_handler_1.AIError('AI Service not initialized. Please configure API key.', error_handler_1.AIErrorType.AUTHENTICATION);
        }
        if (this.isOfflineMode) {
            return this.getOfflineExplanation(code);
        }
        return this.retryWithBackoff(async () => {
            const promptContext = this.buildPromptContext({ selectedText: code });
            const prompt = prompts_1.PromptTemplates.codeExplanation(code, promptContext);
            const generationConfig = {
                temperature: 0.4,
                topK: 30,
                topP: 0.9,
                maxOutputTokens: 1536,
            };
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = result.response;
            const text = response.text();
            return this.parseExplanationResponse(text);
        });
    }
    async chatWithAI(message, context) {
        if (!this.isInitialized || !this.model) {
            throw new error_handler_1.AIError('AI Service not initialized. Please configure API key.', error_handler_1.AIErrorType.AUTHENTICATION);
        }
        if (this.isOfflineMode) {
            return this.getOfflineChat(message, context);
        }
        return this.retryWithBackoff(async () => {
            const promptContext = this.buildPromptContext(context);
            const prompt = prompts_1.PromptTemplates.chat(message, promptContext);
            const generationConfig = {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            };
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = result.response;
            const text = response.text();
            return this.parseChatResponse(text);
        });
    }
    buildPromptContext(context) {
        return {
            currentFile: context.currentFile,
            selectedText: context.selectedText,
            cursorPosition: context.cursorPosition,
            surroundingCode: context.surroundingCode,
            projectContext: context.projectContext,
            language: this.detectLanguageFromContext(context),
            framework: context.framework
        };
    }
    detectLanguageFromContext(context) {
        if (context.language)
            return context.language;
        if (context.currentFile) {
            const extension = context.currentFile.split('.').pop()?.toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'jsx': 'javascript',
                'ts': 'typescript',
                'tsx': 'typescript',
                'py': 'python',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'c',
                'cs': 'csharp',
                'php': 'php',
                'rb': 'ruby',
                'go': 'go',
                'rs': 'rust'
            };
            return languageMap[extension || ''] || 'javascript';
        }
        return 'javascript';
    }
    parseCompletionSuggestions(text) {
        // Split by lines and filter out empty lines
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        // Take up to 3 suggestions
        return lines.slice(0, 3).map(line => line.trim());
    }
    parseEditResponse(text, originalCode, instruction) {
        const sections = this.parseSections(text);
        const modifiedCode = sections.MODIFIED_CODE || originalCode + '\n// Modified by AI';
        const explanation = sections.EXPLANATION || `Applied instruction: ${instruction}`;
        const changesText = sections.CHANGES || '';
        // Calculate changes (simplified)
        const changes = [{
                startLine: 1,
                endLine: originalCode.split('\n').length,
                oldText: originalCode,
                newText: modifiedCode
            }];
        return {
            modifiedCode,
            explanation,
            changes
        };
    }
    parseExplanationResponse(text) {
        const sections = this.parseSections(text);
        const explanation = sections.EXPLANATION || 'This code performs various operations.';
        const conceptsText = sections.CONCEPTS || 'programming, logic';
        const complexityText = sections.COMPLEXITY || 'medium';
        const concepts = conceptsText.split(',').map(c => c.trim()).filter(c => c.length > 0);
        const complexity = ['low', 'medium', 'high'].includes(complexityText.toLowerCase())
            ? complexityText.toLowerCase()
            : 'medium';
        return {
            explanation,
            concepts,
            complexity
        };
    }
    parseChatResponse(text) {
        // Extract code blocks if any
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeExamples = text.match(codeBlockRegex)?.map(block => block.replace(/```\w*\n?/g, '').replace(/```/g, '').trim()) || [];
        // Remove code blocks from main message
        const message = text.replace(codeBlockRegex, '[Code example provided]').trim();
        return {
            message,
            suggestions: [], // Could be enhanced to extract suggestions
            codeExamples
        };
    }
    parseSections(text) {
        const sections = {};
        const lines = text.split('\n');
        let currentSection = '';
        let currentContent = [];
        for (const line of lines) {
            const sectionMatch = line.match(/^([A-Z_]+):\s*$/);
            if (sectionMatch) {
                // Save previous section
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                // Start new section
                currentSection = sectionMatch[1];
                currentContent = [];
            }
            else if (currentSection) {
                currentContent.push(line);
            }
        }
        // Save last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        return sections;
    }
    calculateConfidence(response) {
        // Simple confidence calculation based on response quality
        // This could be enhanced with more sophisticated metrics
        return 0.85;
    }
    isReady() {
        return this.isInitialized && this.apiKey !== null && this.model !== null;
    }
    getApiKeyStatus() {
        if (!this.apiKey)
            return 'not-set';
        if (!this.isInitialized)
            return 'invalid';
        return 'set';
    }
    async setApiKey(apiKey) {
        // Store the API key securely
        await key_storage_1.keyStorageService.setApiKey('gemini-api-key', apiKey);
        // Reinitialize with the new key
        await this.initialize(apiKey);
    }
    async clearApiKey() {
        await key_storage_1.keyStorageService.deleteApiKey('gemini-api-key');
        this.isInitialized = false;
        this.genAI = null;
        this.model = null;
        this.apiKey = null;
        this.isOfflineMode = false;
        this.rateLimiter.reset();
    }
    /**
     * Get offline mode fallback responses
     */
    getOfflineCompletion(context) {
        return {
            suggestions: [
                '// AI service is offline - basic completion',
                'console.log("Offline mode");',
                'const placeholder = null;'
            ],
            confidence: 0.1
        };
    }
    getOfflineEdit(instruction, code) {
        return {
            modifiedCode: code + '\n// AI service offline - no changes applied',
            explanation: `AI service is offline. Instruction "${instruction}" could not be processed.`,
            changes: []
        };
    }
    getOfflineExplanation(code) {
        return {
            explanation: 'AI service is offline. Code explanation is not available.',
            concepts: ['offline'],
            complexity: 'medium'
        };
    }
    getOfflineChat(message, context) {
        return {
            message: 'AI service is currently offline. Please check your internet connection and API key configuration.',
            suggestions: [
                'Check your internet connection',
                'Verify your API key is valid',
                'Try again later'
            ],
            codeExamples: []
        };
    }
    /**
     * Get service status information
     */
    getServiceStatus() {
        return {
            isInitialized: this.isInitialized,
            isOfflineMode: this.isOfflineMode,
            apiKeyStatus: this.getApiKeyStatus(),
            rateLimiterStatus: this.rateLimiter.getStatus()
        };
    }
    /**
     * Attempt to reconnect and exit offline mode
     */
    async reconnect() {
        if (!this.isOfflineMode) {
            return true;
        }
        try {
            if (this.apiKey) {
                await this.initialize(this.apiKey);
                return true;
            }
            return false;
        }
        catch (error) {
            console.warn('Reconnection failed:', error);
            return false;
        }
    }
    /**
     * Check if service is in offline mode
     */
    isInOfflineMode() {
        return this.isOfflineMode;
    }
}
exports.AIService = AIService;
//# sourceMappingURL=gemini-client.js.map