import React from 'react';
import MCPChat from '@/components/mcp/MCPChat';

export const metadata = {
    title: 'MCP Chat Demo | Betty Organic',
    description: 'Demo of the Model Context Protocol implementation',
};

export default function MCPChatDemoPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Model Context Protocol Demo</h1>
                    <p className="text-muted-foreground">
                        This demo showcases the integration of Model Context Protocol (MCP) in the Betty Organic app.
                    </p>
                </div>

                <MCPChat
                    initialSystemPrompt="You are a helpful assistant for Betty Organic, a fresh organic fruit delivery service in Ethiopia. Help customers with their questions about our products, delivery services, and organic farming practices. Be friendly, informative, and concise."
                    title="Betty Organic Assistant"
                    placeholder="Ask about our organic products, delivery, or farming practices..."
                />

                <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">What is Model Context Protocol?</h2>
                    <p className="mb-3">
                        Model Context Protocol (MCP) is a standardized way for applications to communicate with AI models,
                        providing context and receiving responses in a structured format.
                    </p>
                    <h3 className="text-lg font-medium mt-4 mb-1">Key Benefits:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Standardized communication with AI models</li>
                        <li>Consistent handling of context information</li>
                        <li>Support for function calling</li>
                        <li>Built-in analytics and monitoring</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}