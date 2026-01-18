"use strict";
/**
 * Prompt templates for different AI interactions
 * These templates provide consistent and optimized prompts for various AI operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplates = void 0;
class PromptTemplates {
    /**
     * Generate a code completion prompt
     */
    static codeCompletion(context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        const fileContext = context.currentFile ? `File: ${context.currentFile}` : '';
        const positionContext = context.cursorPosition
            ? `Position: Line ${context.cursorPosition.line}, Column ${context.cursorPosition.column}`
            : '';
        return `You are an expert ${language} developer providing code completions.

${fileContext}
${positionContext}

Context code:
\`\`\`${language}
${context.surroundingCode || ''}
\`\`\`

Provide 3 relevant code completion suggestions that would logically continue from the cursor position. Consider:
- The current context and scope
- Common ${language} patterns and best practices
- Variable names and function signatures in scope
- Import statements and dependencies

Return only the completion suggestions, one per line, without explanations or markdown formatting.`;
    }
    /**
     * Generate a code editing prompt
     */
    static codeEdit(instruction, code, context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        const projectInfo = context.projectContext
            ? `Project: ${context.projectContext.summary || 'Unknown project'}`
            : '';
        return `You are an expert ${language} developer. Apply the following instruction to the given code.

${projectInfo}

Instruction: ${instruction}

Original Code:
\`\`\`${language}
${code}
\`\`\`

Please respond in the following format:

MODIFIED_CODE:
\`\`\`${language}
[The modified code here]
\`\`\`

EXPLANATION:
[Brief explanation of what was changed and why]

CHANGES:
[List of specific changes made, one per line]

Guidelines:
- Maintain code style and formatting consistency
- Follow ${language} best practices and conventions
- Preserve existing functionality unless explicitly asked to change it
- Add appropriate comments for complex changes
- Ensure the code remains syntactically correct`;
    }
    /**
     * Generate a code explanation prompt
     */
    static codeExplanation(code, context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        const complexity = this.estimateComplexity(code);
        return `You are an expert ${language} developer. Analyze and explain the following code clearly and concisely.

Code to explain:
\`\`\`${language}
${code}
\`\`\`

Please respond in the following format:

EXPLANATION:
[Provide a clear, step-by-step explanation of what this code does. Adjust the detail level for ${complexity} complexity code. Include the purpose, main logic flow, and any important details.]

CONCEPTS:
[List the key programming concepts demonstrated in this code, separated by commas]

COMPLEXITY:
[Rate as: low, medium, or high]

Guidelines:
- Use clear, accessible language
- Explain any complex algorithms or patterns
- Mention potential issues or improvements if relevant
- Focus on the "what" and "why", not just the "how"`;
    }
    /**
     * Generate a chat conversation prompt
     */
    static chat(message, context, conversationHistory) {
        const projectInfo = context.projectContext ? `
Current Project Context:
- Root path: ${context.projectContext.rootPath}
- Summary: ${context.projectContext.summary}
- Main files: ${context.projectContext.files?.slice(0, 5).join(', ') || 'None listed'}
- Dependencies: ${context.projectContext.dependencies?.slice(0, 5).join(', ') || 'None listed'}
` : '';
        const currentFileInfo = context.currentFile ? `
Current File: ${context.currentFile}
Selected Code: ${context.selectedText ? `\n\`\`\`\n${context.selectedText}\n\`\`\`\n` : 'None'}
` : '';
        const historyContext = conversationHistory && conversationHistory.length > 0 ? `
Previous conversation:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : '';
        return `You are an AI programming assistant helping with software development. You are knowledgeable, helpful, and provide practical advice.

${projectInfo}${currentFileInfo}${historyContext}

User: ${message}

Guidelines:
- Provide helpful, accurate, and practical advice
- If suggesting code, format it properly with syntax highlighting
- Consider the project context when giving recommendations
- Ask clarifying questions if the request is ambiguous
- Offer multiple approaches when appropriate
- Be concise but thorough in your explanations`;
    }
    /**
     * Generate a refactoring prompt
     */
    static refactoring(code, refactoringType, context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        return `You are an expert ${language} developer specializing in code refactoring. Apply the "${refactoringType}" refactoring to the following code.

Original Code:
\`\`\`${language}
${code}
\`\`\`

Refactoring Type: ${refactoringType}

Please respond in the following format:

REFACTORED_CODE:
\`\`\`${language}
[The refactored code here]
\`\`\`

EXPLANATION:
[Explain what was refactored and why it's an improvement]

BENEFITS:
[List the benefits of this refactoring]

CONSIDERATIONS:
[Any important considerations or potential impacts]

Guidelines:
- Maintain the original functionality
- Follow ${language} best practices
- Improve code readability and maintainability
- Consider performance implications
- Preserve existing interfaces where possible`;
    }
    /**
     * Generate a debugging prompt
     */
    static debugging(code, error, context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        return `You are an expert ${language} developer helping debug code. Analyze the following code and error to provide a solution.

Code with issue:
\`\`\`${language}
${code}
\`\`\`

Error/Issue: ${error}

Please respond in the following format:

PROBLEM_ANALYSIS:
[Identify the root cause of the issue]

SOLUTION:
\`\`\`${language}
[Provide the corrected code]
\`\`\`

EXPLANATION:
[Explain what was wrong and how the fix addresses it]

PREVENTION:
[Suggest how to prevent similar issues in the future]

Guidelines:
- Focus on the root cause, not just symptoms
- Provide a complete, working solution
- Explain the reasoning behind the fix
- Consider edge cases and potential side effects`;
    }
    /**
     * Generate a code review prompt
     */
    static codeReview(code, context) {
        const language = context.language || this.detectLanguage(context.currentFile);
        return `You are an experienced ${language} developer conducting a code review. Analyze the following code for quality, best practices, and potential improvements.

Code to review:
\`\`\`${language}
${code}
\`\`\`

Please respond in the following format:

OVERALL_ASSESSMENT:
[General assessment of code quality]

STRENGTHS:
[What the code does well]

ISSUES:
[Problems or concerns, if any]

SUGGESTIONS:
[Specific improvement recommendations]

BEST_PRACTICES:
[Adherence to ${language} best practices]

Guidelines:
- Be constructive and specific in feedback
- Consider readability, maintainability, and performance
- Suggest concrete improvements
- Acknowledge good practices
- Consider the broader context and requirements`;
    }
    /**
     * Detect programming language from file extension
     */
    static detectLanguage(filePath) {
        if (!filePath)
            return 'javascript';
        const extension = filePath.split('.').pop()?.toLowerCase();
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
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql'
        };
        return languageMap[extension || ''] || 'text';
    }
    /**
     * Estimate code complexity based on simple heuristics
     */
    static estimateComplexity(code) {
        const lines = code.split('\n').length;
        const complexPatterns = [
            /class\s+\w+/g,
            /function\s+\w+/g,
            /=>\s*{/g,
            /if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /try\s*{/g,
            /catch\s*\(/g
        ];
        let complexityScore = lines * 0.1;
        complexPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexityScore += matches.length * 2;
            }
        });
        if (complexityScore < 10)
            return 'low';
        if (complexityScore < 30)
            return 'medium';
        return 'high';
    }
    /**
     * Create a context-aware prompt with project information
     */
    static withProjectContext(basePrompt, context) {
        if (!context.projectContext)
            return basePrompt;
        const projectInfo = `
Project Context:
- Path: ${context.projectContext.rootPath}
- Summary: ${context.projectContext.summary}
- Framework: ${context.framework || 'Not specified'}
- Dependencies: ${context.projectContext.dependencies?.join(', ') || 'None'}

`;
        return projectInfo + basePrompt;
    }
}
exports.PromptTemplates = PromptTemplates;
//# sourceMappingURL=prompts.js.map