"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MessageCircle, Settings, Loader2, Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import { AmharicFileUpload } from "@/components/amharic/AmharicFileUpload";
import { AmharicTextDisplay } from "@/components/amharic/AmharicTextDisplay";

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
  const [processingProgress, setProcessingProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [mistralKey, setMistralKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
    setOcrResult(null);
    setChatMessages([]);
  };

  const simulateProgress = () => {
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const processOCR = async () => {
    if (!file || !mistralKey) {
      toast.error("Please upload a file and provide Mistral API key");
      return;
    }

    setIsProcessing(true);
    const progressInterval = simulateProgress();

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
      setProcessingProgress(100);
      setActiveTab("results");
      toast.success("OCR processing completed!");
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error("Failed to process document. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setProcessingProgress(0);
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
          የአማርኛ አንባቢ Amharic OCR Chatbot
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload Amharic documents and chat with them using advanced AI • የአማርኛ ሰነዶችን ይልቀቁ እና በላቀ AI አማካኝነት ይውያዩ
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-full">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Mistral OCR + Gemini 3</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1 rounded-full">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-green-700">Ge'ez Script Optimized</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload • ወርቀቅ
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Results • ውጤት
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat • ውይይት
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings • ሴቲንግስ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <AmharicFileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={file}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
          />
          
          {file && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ready to process</p>
                    <p className="text-sm text-muted-foreground">
                      Click below to extract text using Mistral OCR
                    </p>
                  </div>
                  <Button
                    onClick={processOCR}
                    disabled={isProcessing || !mistralKey}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Process with Mistral OCR
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {ocrResult ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Extraction Metadata • የማውጣት መረጃ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{ocrResult.metadata.pages}</div>
                      <div className="text-sm text-muted-foreground">Pages • ገጾች</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 capitalize">{ocrResult.metadata.language}</div>
                      <div className="text-sm text-muted-foreground">Language • ቋንቋ</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(ocrResult.metadata.confidence * 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Confidence • እርግጠኛነት</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{Object.keys(ocrResult.images).length}</div>
                      <div className="text-sm text-muted-foreground">Images • ምስሎች</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AmharicTextDisplay
                text={ocrResult.extractedText}
                title="Extracted Text • የተወጣ ጽሁፍ"
                showAnalysis={true}
                enableFormatting={true}
              />

              <AmharicTextDisplay
                text={ocrResult.markdown}
                title="Structured Content (Markdown) • የተዋቀረ ይዘት"
                showAnalysis={false}
                enableFormatting={false}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">No OCR results yet</p>
                  <p className="text-muted-foreground">Upload and process a document first</p>
                  <p className="text-sm text-muted-foreground mt-2">ምንም የ OCR ውጤት የለም • መጀመሪያ ሰነድ ይልቀቁ እና ያስኬዱ</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat with Your Document • ከሰነድዎ ጋር ውይይት
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>Start asking questions about your document...</p>
                          <p className="text-sm mt-2">ስለ ሰነድዎ ጥያቄዎችን መጠየቅ ይጀምሩ...</p>
                          <div className="mt-4 text-xs text-gray-500">
                            <p>Try asking: • መሞከር ይችላሉ:</p>
                            <p>"ይህ ሰነድ ስለ ምን ነው?" (What is this document about?)</p>
                            <p>"ዋና ዋና ነጥቦቹ ምንድን ናቸው?" (What are the main points?)</p>
                          </div>
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
                                  : "bg-white border text-gray-900"
                              }`}
                              style={{
                                fontFamily: 'Noto Sans Ethiopic, Abyssinica SIL, Nyala, PowerGeez, serif'
                              }}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex justify-start">
                          <div className="bg-white border p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a question about your document in Amharic or English... ስለ ሰነድዎ በአማርኛ ወይም በእንግሊዝኛ ጥያቄ ያንሱ..."
                        className="flex-1 min-h-[60px]"
                        style={{
                          fontFamily: 'Noto Sans Ethiopic, Abyssinica SIL, Nyala, PowerGeez, serif'
                        }}
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
                        className="bg-gradient-to-r from-green-600 to-blue-600 self-end"
                        size="lg"
                      >
                        {isChatting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send • ላክ"
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
                  <p className="text-sm text-muted-foreground mt-2">ውይይትን ለማስቻል መጀመሪያ ሰነድ ያስኬዱ</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration • የ API ማዋቀሪያ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="mistral-key" className="text-base font-medium">
                  Mistral AI API Key
                </Label>
                <Input
                  id="mistral-key"
                  type="password"
                  value={mistralKey}
                  onChange={(e) => setMistralKey(e.target.value)}
                  placeholder="Enter your Mistral API key"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Required for OCR processing • ለ OCR ሂደት ያስፈልጋል
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="gemini-key" className="text-base font-medium">
                  Google Gemini API Key
                </Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Google Gemini API key"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Required for chat functionality • ለውይይት ተግባር ያስፈልጋል
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">API Status • የ API ሁኔታ</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Mistral OCR</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      mistralKey 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mistralKey ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Gemini Chat</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      geminiKey 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {geminiKey ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800">Getting API Keys • የ API ቁልፎችን ማግኘት</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 space-y-3">
              <div>
                <p className="font-medium">Mistral AI:</p>
                <p>Visit <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer" className="underline">console.mistral.ai</a> to get your API key</p>
              </div>
              <div>
                <p className="font-medium">Google Gemini:</p>
                <p>Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}