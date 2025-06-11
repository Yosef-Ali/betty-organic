"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MessageCircle, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OCRResult {
  extractedText: string;
  markdown: string;
  images: { [key: string]: string };
  metadata: {
    pages: number;
    language: string;
    confidence: number;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AmharicOCRPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [mistralKey, setMistralKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(uploadedFile.type)) {
        toast.error("Please upload a PDF or image file (JPEG, PNG)");
        return;
      }
      
      // Check file size (10MB limit)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setFile(uploadedFile);
      toast.success("File uploaded successfully!");
    }
  };

  const processOCR = async () => {
    if (!file || !mistralKey) {
      toast.error("Please upload a file and provide Mistral API key");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', mistralKey);

      const response = await fetch('/api/amharic-ocr/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      setOcrResult(result);
      setActiveTab("results");
      toast.success("OCR processing completed!");
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error("Failed to process document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !ocrResult || !geminiKey) {
      toast.error("Please provide a question, OCR results, and Gemini API key");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsChatting(true);

    try {
      const response = await fetch('/api/amharic-ocr/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput,
          ocrData: ocrResult,
          apiKey: geminiKey,
          chatHistory: chatMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const result = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Amharic Multimodal OCR Chatbot
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload Amharic documents and chat with them using advanced AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            OCR Results
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      {file ? file.name : "Upload Amharic Document"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, JPEG, PNG files up to 10MB
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    {file ? "Change File" : "Choose File"}
                  </Button>
                </div>
              </div>
              
              {file && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={processOCR}
                        disabled={isProcessing || !mistralKey}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process OCR"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {ocrResult ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Extraction Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pages:</span> {ocrResult.metadata.pages}
                      </div>
                      <div>
                        <span className="font-medium">Language:</span> {ocrResult.metadata.language}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {(ocrResult.metadata.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Extracted Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {ocrResult.extractedText}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Structured Content (Markdown)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {ocrResult.markdown}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">No OCR results yet</p>
                  <p className="text-muted-foreground">Upload and process a document first</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          {ocrResult ? (
            <div className="grid gap-6">
              <Card className="min-h-96">
                <CardHeader>
                  <CardTitle>Chat with Your Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          Start asking questions about your document...
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a question about your document in Amharic or English..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={isChatting || !chatInput.trim() || !geminiKey}
                        className="bg-gradient-to-r from-green-600 to-blue-600"
                      >
                        {isChatting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">No document to chat with</p>
                  <p className="text-muted-foreground">Process a document first to enable chat</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mistral-key">Mistral AI API Key</Label>
                <Input
                  id="mistral-key"
                  type="password"
                  value={mistralKey}
                  onChange={(e) => setMistralKey(e.target.value)}
                  placeholder="Enter your Mistral API key"
                />
                <p className="text-xs text-muted-foreground">
                  Required for OCR processing
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Google Gemini API key"
                />
                <p className="text-xs text-muted-foreground">
                  Required for chat functionality
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}