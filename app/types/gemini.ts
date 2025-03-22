export interface GeminiConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export interface GeminiFile {
  mimeType: string;
  fileUri: string;
  displayName: string;
  name: string;
}

export interface GeminiResponse {
  text: () => string;
  // Add other response properties as needed
}

export interface GeminiChatSession {
  sendMessage: (prompt: string) => Promise<{ response: GeminiResponse }>;
}

export interface GeminiServiceConfig {
  modelName?: string;
  generationConfig?: Partial<GeminiConfig>;
}
