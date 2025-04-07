import { useState, useCallback } from 'react';
import mcpClient, {
    MCPMessage,
    MCPRequest,
    MCPResponse,
    MCPFunction,
    createUserMessage,
    createSystemMessage
} from '@/lib/mcp/client';

interface UseMCPOptions {
    initialMessages?: MCPMessage[];
    functions?: MCPFunction[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    onError?: (error: Error) => void;
}

interface UseMCPReturn {
    messages: MCPMessage[];
    isLoading: boolean;
    error: Error | null;
    addMessage: (content: string, role?: 'user' | 'system') => void;
    generateResponse: (options?: {
        stream?: boolean;
        functionCall?: 'auto' | 'none' | { name: string };
    }) => Promise<MCPResponse | null>;
    resetConversation: () => void;
}

export function useMCP({
    initialMessages = [],
    functions,
    model,
    temperature,
    maxTokens,
    onError
}: UseMCPOptions = {}): UseMCPReturn {
    const [messages, setMessages] = useState<MCPMessage[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const addMessage = useCallback((content: string, role: 'user' | 'system' = 'user') => {
        const message = role === 'user'
            ? createUserMessage(content)
            : createSystemMessage(content);

        setMessages(prev => [...prev, message]);
    }, []);

    const generateResponse = useCallback(async (options?: {
        stream?: boolean;
        functionCall?: 'auto' | 'none' | { name: string };
    }): Promise<MCPResponse | null> => {
        if (messages.length === 0) {
            const err = new Error('No messages to generate a response for');
            setError(err);
            onError?.(err);
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: MCPRequest = {
                messages,
                functions,
                model,
                temperature,
                maxTokens,
                stream: options?.stream,
                function_call: options?.functionCall
            };

            const response = await mcpClient.generateResponse(request);

            // Add the assistant's response to our message list
            if (response.choices[0]?.message) {
                setMessages(prev => [...prev, response.choices[0].message]);
            }

            // Handle function calls if present
            if (response.choices[0]?.message?.function_call) {
                const functionResponse = await mcpClient.handleFunctionCall(response);

                // Add the function result to our message list if it was returned
                if (functionResponse.choices[0]?.message?.role === 'function') {
                    setMessages(prev => [...prev, functionResponse.choices[0].message]);
                }
            }

            // Store the interaction for analytics
            await mcpClient.storeInteraction(request, response);

            return response;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error during MCP request');
            setError(error);
            onError?.(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [messages, functions, model, temperature, maxTokens, onError]);

    const resetConversation = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        addMessage,
        generateResponse,
        resetConversation
    };
}