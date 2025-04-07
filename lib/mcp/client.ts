import { createClient as createSupabaseClient } from '@/lib/supabase/client';

// Basic types for MCP communication
export interface MCPMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
}

export interface MCPRequest {
    messages: MCPMessage[];
    functions?: MCPFunction[];
    function_call?: 'auto' | 'none' | { name: string };
    stream?: boolean;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    additionalContext?: Record<string, any>;
}

export interface MCPFunction {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}

export interface MCPResponse {
    id: string;
    choices: {
        message: MCPMessage;
        finish_reason: string;
        index: number;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// MCP Client for betty-organic-app
export class MCPClient {
    private modelEndpoint: string;
    private apiKey: string;
    private defaultModel: string;

    constructor(config: {
        modelEndpoint?: string;
        apiKey?: string;
        defaultModel?: string;
    } = {}) {
        this.modelEndpoint = config.modelEndpoint || process.env.NEXT_PUBLIC_MCP_ENDPOINT || '';
        this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_MCP_API_KEY || '';
        this.defaultModel = config.defaultModel || 'gpt-4';
    }

    async generateResponse(request: MCPRequest): Promise<MCPResponse> {
        try {
            // If no model specified, use the default
            const model = request.model || this.defaultModel;

            // Prepare the request payload
            const payload = {
                model,
                messages: request.messages,
                functions: request.functions,
                function_call: request.function_call,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens,
                stream: request.stream || false,
            };

            // Make the API call to the model endpoint
            const response = await fetch(this.modelEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MCP request failed: ${response.status} ${errorText}`);
            }

            // Parse and return the response
            const data = await response.json();
            return data as MCPResponse;
        } catch (error) {
            console.error('MCP generate error:', error);
            throw error;
        }
    }

    // Method to handle function calls
    async handleFunctionCall(mcpResponse: MCPResponse): Promise<MCPResponse> {
        try {
            const functionCall = mcpResponse.choices[0]?.message?.function_call;

            if (!functionCall) {
                return mcpResponse;
            }

            // Log the function call for debugging
            console.log(`Function called: ${functionCall.name} with args:`, functionCall.arguments);

            // Here you would implement the actual function execution
            // For now, we'll just return a placeholder response

            return {
                ...mcpResponse,
                choices: [
                    {
                        ...mcpResponse.choices[0],
                        message: {
                            role: 'function',
                            name: functionCall.name,
                            content: JSON.stringify({ result: 'Function executed successfully' })
                        }
                    }
                ]
            };
        } catch (error) {
            console.error('MCP function handling error:', error);
            throw error;
        }
    }

    // Method to store MCP interactions in Supabase
    async storeInteraction(request: MCPRequest, response: MCPResponse): Promise<void> {
        try {
            const supabase = createSupabaseClient();

            // Store the interaction in the database for later analysis
            await supabase
                .from('mcp_interactions')
                .insert({
                    request: request,
                    response: response,
                    timestamp: new Date().toISOString(),
                    model: request.model || this.defaultModel
                });
        } catch (error) {
            console.error('Failed to store MCP interaction:', error);
            // Non-blocking - we don't want to fail the whole request if logging fails
        }
    }
}

// Singleton instance for easy import
export const mcpClient = new MCPClient();

// Helper function to create a user message
export function createUserMessage(content: string): MCPMessage {
    return {
        role: 'user',
        content
    };
}

// Helper function to create a system message
export function createSystemMessage(content: string): MCPMessage {
    return {
        role: 'system',
        content
    };
}

export default mcpClient;