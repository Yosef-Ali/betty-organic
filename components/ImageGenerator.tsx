// src/components/ImageGenerator.tsx
'use client'; // This component uses client-side features (useState, event handlers)

import React, { useState, ChangeEvent, FormEvent } from 'react';

interface ApiResponse {
  imageUrl: string | null; // Expecting base64 data URL ideally
  fileUri?: string; // The raw Gemini file URI (for debugging/alternative handling)
  mimeType?: string; // Mime type of the Gemini file
  message?: string; // Any text message from the API
  error?: string; // Error message
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null); // To display text from API

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInputFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedImageUrl(null); // Clear previous generated image on new input
      setError(null);
      setApiMessage(null);
    } else {
      setInputFile(null);
      setPreviewUrl(null);
    }
  };

  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrompt(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt && !inputFile) {
      setError('Please provide a prompt or an image file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setApiMessage(null);

    const formData = new FormData();
    formData.append('prompt', prompt);
    if (inputFile) {
      formData.append('inputFile', inputFile);
    }

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header; browser sets it correctly for FormData
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }

      console.log("API Response:", result);

      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      } else if (result.fileUri) {
        // Handle the case where we only got the URI
        // We cannot display this directly in an <img> tag.
        console.warn("Received fileUri, but cannot display directly:", result.fileUri);
        setError(`Received image data reference (URI: ${result.fileUri}), but cannot display it directly. Backend needs adjustment to fetch content.`);
      }

      if (result.message) {
        setApiMessage(result.message);
      }


    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Gemini Image Generator</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="prompt" style={{ display: 'block', marginBottom: '5px' }}>Prompt:</label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="e.g., Make the croissant look more golden brown"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="inputFile" style={{ display: 'block', marginBottom: '5px' }}>Input Image (Optional):</label>
          <input
            type="file"
            id="inputFile"
            accept="image/jpeg, image/png, image/webp" // Adjust accepted types as needed
            onChange={handleFileChange}
            style={{ display: 'block' }}
            disabled={isLoading}
          />
        </div>

        {previewUrl && (
          <div style={{ marginBottom: '15px' }}>
            <p>Input Image Preview:</p>
            <img src={previewUrl} alt="Input preview" style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }} />
          </div>
        )}

        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>

      {isLoading && <p style={{ marginTop: '15px' }}>Processing, please wait...</p>}

      {error && <p style={{ color: 'red', marginTop: '15px' }}>Error: {error}</p>}

      {apiMessage && !generatedImageUrl && <p style={{ marginTop: '15px', fontStyle: 'italic' }}>API Message: {apiMessage}</p>}

      {generatedImageUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated Image:</h3>
          {apiMessage && <p style={{ fontStyle: 'italic' }}>{apiMessage}</p>}
          <img src={generatedImageUrl} alt="Generated by Gemini" style={{ maxWidth: '100%', display: 'block', marginTop: '10px' }} />
        </div>
      )}
    </div>
  );
}
