'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMCP } from '@/hooks/useMCP';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';

export interface MCPChatProps {
    initialSystemPrompt?: string;
    title?: string;
    placeholder?: string;
    className?: string;
}

export default function MCPChat({
    initialSystemPrompt = "You are a helpful assistant for Betty Organic.",
    title = "AI Assistant",
    placeholder = "Type your message here...",
    className = "",
}: MCPChatProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initialize the MCP hook with a system prompt
    const {
        messages,
        isLoading,
        error,
        addMessage,
        generateResponse,
        resetConversation
    } = useMCP({
        initialMessages: initialSystemPrompt
            ? [{ role: 'system', content: initialSystemPrompt }]
            : [],
        model: 'gpt-4',
        temperature: 0.7,
        onError: (err) => console.error('MCP error:', err)
    });

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus the input field on component mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        // Add user message to the conversation
        addMessage(input);
        setInput('');

        // Generate AI response
        await generateResponse();
    };

    const handleReset = () => {
        resetConversation();
        if (initialSystemPrompt) {
            addMessage(initialSystemPrompt, 'system');
        }
    };

    return (
        <Card className={`flex flex-col h-[600px] ${className}`}>
            <div className="p-4 border-b">
                <h3 className="font-semibold">{title}</h3>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.filter(m => m.role !== 'system').map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center">
                        <div className="max-w-[80%] rounded-lg p-3 bg-destructive text-destructive-foreground">
                            <p>Error: {error.message}</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className="flex-grow resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="flex flex-col gap-2">
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleReset}
                            title="Reset conversation"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}