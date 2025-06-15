'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertCircle, Copy } from 'lucide-react';

export default function WhatsAppPDFDebugPage() {
    const [debugInfo, setDebugInfo] = useState<{
        ngrokUrl?: string;
        baseUrl?: string;
        twilioConfigured?: boolean;
        pdfTestUrl?: string;
        errors: string[];
    }>({
        errors: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkConfiguration();
    }, []);

    const checkConfiguration = async () => {
        setIsLoading(true);
        const errors: string[] = [];
        
        // Check environment variables
        const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL;
        const baseUrl = ngrokUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        
        // Check if using localhost without ngrok
        if (baseUrl.includes('localhost') && !ngrokUrl) {
            errors.push('Using localhost URL - Twilio cannot access PDFs. Please set up ngrok!');
        }

        // Check Twilio configuration
        try {
            const response = await fetch('/api/twilio/config-check');
            const configData = await response.json();
            
            setDebugInfo({
                ngrokUrl: ngrokUrl || 'Not configured',
                baseUrl,
                twilioConfigured: configData.success,
                pdfTestUrl: `${baseUrl}/api/temp-pdf/test`,
                errors: [
                    ...errors,
                    ...(configData.results?.errors || [])
                ]
            });
        } catch (error) {
            errors.push('Failed to check Twilio configuration');
            setDebugInfo({
                ngrokUrl: ngrokUrl || 'Not configured',
                baseUrl,
                twilioConfigured: false,
                errors
            });
        }
        
        setIsLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const testPDFAccessibility = async () => {
        if (!debugInfo.baseUrl) return;

        try {
            // Create a test PDF
            const response = await fetch('/api/temp-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfData: btoa('Test PDF content'),
                    filename: 'test.pdf',
                    expiresIn: 3600
                })
            });

            if (response.ok) {
                const result = await response.json();
                const testUrl = result.url.replace('http://localhost:3000', debugInfo.baseUrl);
                
                // Try to access it
                const accessTest = await fetch(testUrl, { method: 'HEAD' });
                
                if (accessTest.ok) {
                    alert(`✅ PDF is accessible at: ${testUrl}`);
                } else {
                    alert(`❌ PDF is not accessible. Status: ${accessTest.status}`);
                }
            }
        } catch (error) {
            alert('❌ PDF accessibility test failed: ' + error);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">🔍 WhatsApp PDF Debug Dashboard</h1>
                <p className="text-gray-600">
                    Diagnose and fix PDF WhatsApp sending issues
                </p>
            </div>

            {/* Configuration Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Ngrok URL</span>
                                {debugInfo.ngrokUrl && debugInfo.ngrokUrl !== 'Not configured' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <code className="text-sm bg-gray-100 p-1 rounded block break-all">
                                {debugInfo.ngrokUrl}
                            </code>
                            {debugInfo.ngrokUrl === 'Not configured' && (
                                <p className="text-xs text-red-600 mt-1">
                                    Run: ./start-ngrok.sh
                                </p>
                            )}
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Base URL</span>
                                {!debugInfo.baseUrl?.includes('localhost') ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                )}
                            </div>
                            <code className="text-sm bg-gray-100 p-1 rounded block break-all">
                                {debugInfo.baseUrl}
                            </code>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Twilio Configuration</span>
                                {debugInfo.twilioConfigured ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <p className="text-sm">
                                {debugInfo.twilioConfigured ? 'Properly configured' : 'Check .env.local'}
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">PDF Accessibility</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={testPDFAccessibility}
                                >
                                    Test
                                </Button>
                            </div>
                            <p className="text-sm">
                                Test if PDFs are publicly accessible
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Errors */}
            {debugInfo.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Issues Found:</strong>
                        <ul className="list-disc ml-4 mt-2">
                            {debugInfo.errors.map((error, index) => (
                                <li key={index} className="text-sm">{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Setup Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>🚀 Quick Setup Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-semibold mb-2">1. Install ngrok (if not installed)</h3>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <code className="text-sm">./setup-ngrok.sh</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2"
                                    onClick={() => copyToClipboard('./setup-ngrok.sh')}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Start ngrok</h3>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <code className="text-sm">ngrok http 3000</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2"
                                    onClick={() => copyToClipboard('ngrok http 3000')}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Update .env.local</h3>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <code className="text-sm">NEXT_PUBLIC_NGROK_URL=https://your-subdomain.ngrok.io</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2"
                                    onClick={() => copyToClipboard('NEXT_PUBLIC_NGROK_URL=https://your-subdomain.ngrok.io')}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">4. Restart your app</h3>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <code className="text-sm">npm run dev</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2"
                                    onClick={() => copyToClipboard('npm run dev')}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">5. Test PDF WhatsApp</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.location.href = '/test-pdf-whatsapp'}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Go to Test Page
                                </Button>
                                <Button
                                    onClick={checkConfiguration}
                                    variant="outline"
                                >
                                    Refresh Status
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Troubleshooting Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>🔧 Troubleshooting Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <strong>PDF not showing in WhatsApp?</strong>
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Ensure ngrok is running and URL is updated in .env.local</li>
                            <li>Check that the PDF URL is using HTTPS (not HTTP)</li>
                            <li>Verify Twilio can access the URL (not localhost)</li>
                            <li>Make sure PDF size is under 5MB</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Getting text instead of PDF?</strong>
                        <p>This happens when Twilio can't access the PDF URL. The system falls back to sending text with a download link.</p>
                    </div>
                    <div>
                        <strong>Error messages in console?</strong>
                        <p>Check browser console (F12) for detailed error logs. Look for "PDF URL is localhost" warnings.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
