'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateReceiptPDF, generateReceiptImage, downloadPDF, type ReceiptData } from '@/lib/utils/pdfGenerator';
import { sendPDFReceiptWhatsApp, sendImageDataToWhatsApp } from '@/app/actions/whatsappActions';
import { testPDFUrl } from '@/lib/utils/twilioConfigChecker';
import { FileText, Download, Send, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';

export default function TestPDFWhatsAppPage() {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
    const [isSendingImage, setIsSendingImage] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        details?: any;
    } | null>(null);
    // Static initial data to prevent hydration mismatch
    const staticTestData: ReceiptData = {
        customerName: 'Yosef Alemu',
        customerEmail: 'yosefalemu007@gmail.com',
        orderId: 'BO-SALES-969702', // Static ID to prevent hydration issues
        items: [
            { name: 'greapfruit', quantity: 1.0, price: 250.00 },
            { name: 'Nappa Cabbage', quantity: 1.0, price: 60.00 },
            { name: 'Red cabbage', quantity: 1.0, price: 180.00 }
        ],
        total: 490.00,
        orderDate: '6/13/2025',
        orderTime: '11:45:19 PM',
        storeName: 'Betty Organic',
        storeContact: '+251944113998'
    };

    const [testData, setTestData] = useState<ReceiptData>(staticTestData);

    // Generate fresh test data on client side only
    useEffect(() => {
        const currentDate = new Date();
        setTestData({
            customerName: 'Yosef Alemu',
            customerEmail: 'yosefalemu007@gmail.com',
            orderId: `BO-SALES-${Date.now().toString().slice(-6)}`,
            items: [
                { name: 'greapfruit', quantity: 1.0, price: 250.00 },
                { name: 'Nappa Cabbage', quantity: 1.0, price: 60.00 },
                { name: 'Red cabbage', quantity: 1.0, price: 180.00 }
            ],
            total: 490.00,
            orderDate: currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            orderTime: currentDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
        });
    }, []);

    const testReceiptData = testData;

    const handleTestPDFGeneration = async () => {
        setIsGeneratingPDF(true);
        setTestResult(null);

        try {
            console.log('🧪 Testing PDF generation...');
            const pdfBlob = await generateReceiptPDF(testReceiptData);

            // Download the PDF for testing
            const filename = `Betty_Organic_Test_Receipt_${testReceiptData.orderId}.pdf`;
            downloadPDF(pdfBlob, filename);

            setTestResult({
                success: true,
                message: `✅ PDF generated successfully! Size: ${pdfBlob.size} bytes. Download should start automatically.`,
                details: {
                    filename,
                    size: pdfBlob.size,
                    orderId: testReceiptData.orderId
                }
            });

            console.log('✅ PDF generation test completed successfully');
        } catch (error) {
            console.error('❌ PDF generation test failed:', error);
            setTestResult({
                success: false,
                message: `❌ PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleTestWhatsAppSending = async () => {
        setIsSendingWhatsApp(true);
        setTestResult(null);

        try {
            console.log('🧪 Testing WhatsApp PDF sending...');

            // Generate PDF first
            const pdfBlob = await generateReceiptPDF(testReceiptData);

            // Convert to base64
            const pdfBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                };
                reader.readAsDataURL(pdfBlob);
            });

            console.log('📄 PDF converted to base64, length:', pdfBase64.length);

            // Test with admin phone number (change this to a test number)
            const testPhoneNumber = '+251944113998'; // Betty Organic admin number

            const whatsappResult = await sendPDFReceiptWhatsApp({
                customerPhone: testPhoneNumber,
                customerName: testReceiptData.customerName,
                orderId: testReceiptData.orderId,
                pdfBase64,
                items: testReceiptData.items,
                total: testReceiptData.total,
                orderDate: testReceiptData.orderDate,
                orderTime: testReceiptData.orderTime,
                storeName: testReceiptData.storeName,
                storeContact: testReceiptData.storeContact
            });

            if (whatsappResult.success) {
                setTestResult({
                    success: true,
                    message: `✅ WhatsApp PDF sent successfully via ${whatsappResult.provider}!`,
                    details: {
                        method: whatsappResult.pdfUrl ? 'PDF Document Attachment' : 'Text Message with Link',
                        provider: whatsappResult.provider,
                        pdfUrl: whatsappResult.pdfUrl,
                        messageId: whatsappResult.messageId,
                        whatsappUrl: whatsappResult.whatsappUrl
                    }
                });
                console.log('✅ WhatsApp PDF sending test completed successfully');
            } else {
                throw new Error(whatsappResult.error || 'Unknown WhatsApp sending error');
            }
        } catch (error) {
            console.error('❌ WhatsApp PDF sending test failed:', error);
            setTestResult({
                success: false,
                message: `❌ WhatsApp sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsSendingWhatsApp(false);
        }
    };

    const handleTestTwilioConfig = async () => {
        setTestResult(null);

        try {
            console.log('🔧 Testing Twilio Configuration...');

            // Run configuration verification via API route
            const response = await fetch('/api/twilio/config-check');
            const configData = await response.json();

            if (!response.ok) {
                throw new Error(configData.error || 'Configuration check failed');
            }

            const configResults = configData.results;
            const allPassed = configData.success;

            setTestResult({
                success: allPassed,
                message: allPassed
                    ? '✅ Twilio configuration is properly set up for PDF sending!'
                    : '❌ Twilio configuration issues found. Check console for details.',
                details: {
                    credentials: configResults.credentials ? 'PASS' : 'FAIL',
                    whatsappNumber: configResults.whatsappNumber ? 'PASS' : 'FAIL',
                    accountStatus: configResults.accountStatus ? 'PASS' : 'FAIL',
                    mediaSupport: configResults.mediaSupport ? 'PASS' : 'FAIL',
                    errors: configResults.errors
                }
            });

        } catch (error) {
            console.error('❌ Twilio config test failed:', error);
            setTestResult({
                success: false,
                message: `❌ Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    const handleTestImageGeneration = async () => {
        setIsGeneratingImage(true);
        setTestResult(null);

        try {
            console.log('🧪 Testing Image generation...');
            const imageBlob = await generateReceiptImage(testReceiptData);

            // Download the image for testing
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Betty_Organic_Test_Invoice_${testReceiptData.orderId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setTestResult({
                success: true,
                message: `✅ Image generated successfully! Size: ${imageBlob.size} bytes. Download should start automatically.`,
                details: {
                    filename: `Betty_Organic_Test_Invoice_${testReceiptData.orderId}.png`,
                    size: imageBlob.size,
                    orderId: testReceiptData.orderId,
                    type: 'PNG Image'
                }
            });

            console.log('✅ Image generation test completed successfully');
        } catch (error) {
            console.error('❌ Image generation test failed:', error);
            setTestResult({
                success: false,
                message: `❌ Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleTestImageWhatsAppSending = async () => {
        setIsSendingImage(true);
        setTestResult(null);

        try {
            console.log('🧪 Testing WhatsApp Image sending...');

            // Ensure we have test data
            if (!testReceiptData) {
                throw new Error('Test data not available. Please wait for initialization.');
            }

            // Test with admin phone number (change this to a test number)
            const testPhoneNumber = '+251944113998'; // Betty Organic admin number

            console.log('�️ Generating image on client side...');

            // Generate image on client side first
            const imageBlob = await generateReceiptImage(testReceiptData);

            // Convert to base64
            const imageBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(imageBlob);
            });

            console.log('�📱 Sending image invoice with data:', {
                customerPhone: testPhoneNumber,
                orderId: testReceiptData.orderId,
                total: testReceiptData.total,
                imageSize: imageBlob.size
            });

            // Send the pre-generated image data to server
            const whatsappResult = await sendImageDataToWhatsApp({
                customerPhone: testPhoneNumber,
                customerName: testReceiptData.customerName,
                orderId: testReceiptData.orderId,
                total: testReceiptData.total,
                orderDate: testReceiptData.orderDate,
                orderTime: testReceiptData.orderTime,
                storeName: testReceiptData.storeName,
                storeContact: testReceiptData.storeContact,
                imageBase64
            });

            console.log('📱 WhatsApp result:', whatsappResult);

            if (whatsappResult.success) {
                setTestResult({
                    success: true,
                    message: `✅ WhatsApp Image sent successfully!`,
                    details: {
                        method: 'Image Attachment',
                        provider: 'twilio',
                        imageUrl: whatsappResult.imageUrl,
                        messageId: whatsappResult.messageId,
                        whatsappUrl: whatsappResult.whatsappUrl
                    }
                });
                console.log('✅ WhatsApp Image sending test completed successfully');
            } else {
                throw new Error(whatsappResult.error || 'Unknown WhatsApp sending error');
            }
        } catch (error) {
            console.error('❌ WhatsApp Image sending test failed:', error);
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            setTestResult({
                success: false,
                message: `❌ WhatsApp Image sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsSendingImage(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">🧪 Invoice & WhatsApp Integration Test</h1>
                    <p className="text-gray-600">
                        Test the IMAGE and PDF generation and WhatsApp sending functionality for Betty Organic invoices
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                        ⭐ <strong>Recommended:</strong> Use IMAGE method for WhatsApp - it's simpler and more reliable than PDF
                    </p>
                </div>

                {/* Test Receipt Data Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Test Receipt Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Customer:</strong> {testReceiptData.customerName}
                            </div>
                            <div>
                                <strong>Order ID:</strong> {testReceiptData.orderId}
                            </div>
                            <div>
                                <strong>Date:</strong> {testReceiptData.orderDate}
                            </div>
                            <div>
                                <strong>Time:</strong> {testReceiptData.orderTime}
                            </div>
                            <div className="md:col-span-2">
                                <strong>Items:</strong>
                                <ul className="mt-1 space-y-1">
                                    {testReceiptData.items.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{item.name} ({(item.quantity * 1000).toFixed(0)}g)</span>
                                            <span>ETB {item.price.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="md:col-span-2 text-lg font-semibold">
                                <strong>Total: ETB {testReceiptData.total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Test Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Test Twilio Config
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Verify Twilio WhatsApp configuration for media sending
                            </p>
                            <Button
                                onClick={handleTestTwilioConfig}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Check Configuration
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Test Image Generation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Generate an invoice as PNG image (recommended for WhatsApp)
                            </p>
                            <Button
                                onClick={handleTestImageGeneration}
                                disabled={isGeneratingImage}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Image...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Generate & Download Image
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Test Image WhatsApp
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Send the invoice as IMAGE via WhatsApp (simpler & more reliable)
                            </p>
                            <Button
                                onClick={handleTestImageWhatsAppSending}
                                disabled={isSendingImage || !testReceiptData}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {isSendingImage ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending Image...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Image via WhatsApp
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Test PDF (Legacy)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Generate PDF and send via WhatsApp (more complex, less reliable)
                            </p>
                            <Button
                                onClick={handleTestPDFGeneration}
                                disabled={isGeneratingPDF}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Generate & Download PDF
                                    </>
                                )}
                            </Button>
                            <div className="mt-2">
                                <Button
                                    onClick={handleTestWhatsAppSending}
                                    disabled={isSendingWhatsApp}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {isSendingWhatsApp ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send PDF via WhatsApp
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Test Results */}
                {testResult && (
                    <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <div className="flex items-start gap-2">
                            {testResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                                    {testResult.message}
                                </AlertDescription>
                                {testResult.details && (
                                    <div className="mt-2 p-2 bg-white rounded border text-xs space-y-1">
                                        <div><strong>Details:</strong></div>
                                        {Object.entries(testResult.details).map(([key, value]) => (
                                            <div key={key}>
                                                <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Alert>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>🔧 Testing Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <strong>1. Image Generation Test (Recommended):</strong>
                            <p>Click "Generate & Download Image" to test the PNG image generation. This is the recommended method for WhatsApp as it's simpler and more reliable than PDFs.</p>
                        </div>
                        <div>
                            <strong>2. Image WhatsApp Sending Test:</strong>
                            <p>Click "Send Image via WhatsApp" to test sending the invoice as an image via Twilio WhatsApp API. This is the preferred method.</p>
                        </div>
                        <div>
                            <strong>3. PDF Generation Test (Legacy):</strong>
                            <p>Click "Generate & Download PDF" to test the PDF generation. PDFs are more complex to send via WhatsApp due to file size and accessibility requirements.</p>
                        </div>
                        <div>
                            <strong>4. Expected Results:</strong>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>Images should be properly formatted with Betty Organic branding and easier to view on mobile</li>
                                <li>WhatsApp should receive the image as a media attachment (preferred over PDFs)</li>
                                <li>Images load faster and work better on all devices compared to PDFs</li>
                                <li>If image sending fails, it should fallback to text with download link</li>
                                <li>All console logs should show successful operations</li>
                            </ul>
                        </div>
                        <div>
                            <strong>5. Troubleshooting:</strong>
                            <p>Check the browser console (F12) for detailed logs. If WhatsApp sending fails, verify Twilio credentials and ngrok setup in .env.local file.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
