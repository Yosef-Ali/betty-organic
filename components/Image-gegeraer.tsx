"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RotateCw, ImageIcon, AlertTriangle, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Placeholder for the actual API key.  This should be in a secure,
// server-side environment variable, NOT in client-side code.
const API_KEY = 'AIzaSyCtkGu1fqi4VZbGCA1fxludMnnp5TYDXrw'; // Replace this with your actual API key

// Type Definitions
interface GenerationConfig {
  prompt: string;
  negativePrompt: string;
  image?: string; // Base64 encoded image
  width: number;
  height: number;
  samples: number;
  seed?: number;
  guidanceScale: number;
  steps: number;
  model: string; // e.g., 'gemini-pro'
}

interface GenerationResult {
  images: string[]; // Array of base64 encoded images
  nsfw: boolean[];
  error?: string; // Optional error message
}

// Constants
const AVAILABLE_MODELS = [
  { name: 'Gemini Pro', value: 'gemini-pro' }, // Placeholder
  { name: 'Stable Diffusion XL', value: 'sdxl-base-1.0' }, // Example
  { name: 'Stable Diffusion 1.5', value: 'sd-1.5' },       // Example
  { name: 'Openjourney v4', value: 'openjourney-v4' },
  { name: 'Realistic Vision v5.1', value: 'realistic-vision-v51' },
  { name: 'Dreamlike Photoreal 2.0', value: 'dreamlike-photoreal-2.0' },
  { name: 'Stable Diffusion Refiner', value: 'sdxl-refiner-1.0' },
];

const DEFAULT_CONFIG: GenerationConfig = {
  prompt: 'A scenic landscape',
  negativePrompt: 'blurry, low quality',
  width: 512,
  height: 512,
  samples: 1,
  seed: undefined, // Optional, server will generate if undefined
  guidanceScale: 7.5,
  steps: 30,
  model: 'gemini-pro', // Default model
};

// Animation Variants
const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const settingsVariants = {
  open: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 30 } },
  closed: { opacity: 0, x: '100%', transition: { duration: 0.3 } },
};

// Helper function (simulated API call)
const generateImages = async (config: GenerationConfig): Promise<GenerationResult> => {
  // Simulate API call delay and potential errors
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s delay

  if (!API_KEY) {
    return {
      images: [],
      nsfw: [],
      error: 'API key is missing. Please configure it.',
    };
  }

  if (config.prompt.toLowerCase().includes('nsfw')) {
    return {
      images: [],
      nsfw: [],
      error: 'Prompt blocked due to potential NSFW content.',
    };
  }

  // In a real application, you'd send the config to a server,
  // which would then make the API call to the actual image generation service.
  // This is a simplified simulation.

  const generatedImages: string[] = [];
  const nsfwFlags: boolean[] = [];

  for (let i = 0; i < config.samples; i++) {
    // Generate a placeholder base64 image (replace with actual generation)
    const placeholderImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`; // 1x1 pixel
    generatedImages.push(placeholderImage);
    nsfwFlags.push(false); // Simulate no NSFW content
  }

  // Simulate different results based on the model (for demonstration)
  if (config.model === 'gemini-pro') {
    // Simulate a slightly different placeholder or modify the prompt
    for (let i = 0; i < generatedImages.length; i++) {
      generatedImages[i] = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`; // 2x2
    }
  }

  return { images: generatedImages, nsfw: nsfwFlags };
};

const ImageToImageApp = () => {
  // State
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputImage, setInputImage] = useState<string | null>(null); // Base64
  const [error, setError] = useState<string | null>(null);

  // Refs
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const negativePromptInputRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Effects
  // Auto-resize textareas
  useEffect(() => {
    const textareas = [promptInputRef, negativePromptInputRef];
    textareas.forEach(ref => {
      if (ref && ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    });
  }, [config.prompt, config.negativePrompt]);

  // Handle clicks outside of settings panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        isSettingsOpen
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Handlers
  const handleInputChange = (
    key: keyof GenerationConfig,
    value: string | number | undefined
  ) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResults(null); // Clear previous results
    setError(null);
    try {
      const result = await generateImages(config);
      if (result.error) {
        setError(result.error);
        setResults(null);
      } else {
        setResults(result);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during image generation.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setResults(null);
    setError(null);
    setInputImage(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const resultAsString = e.target.result as string;
          setInputImage(resultAsString);
          // Also update the config, so the image is sent for generation
          setConfig(prevConfig => ({
            ...prevConfig,
            image: resultAsString,
          }));
        }
      };
      reader.readAsDataURL(file);
    } else {
      setInputImage(null);
      setConfig(prevConfig => ({
        ...prevConfig,
        image: undefined, // Clear the image from the config
      }));
    }
  };

  const handleSeedChange = (value: string) => {
    const seedValue = value === '' ? undefined : parseInt(value, 10);
    handleInputChange('seed', seedValue);
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <ImageIcon className="inline-block mr-2 w-6 h-6" />
          Image Generation App
        </h1>
        <Button
          variant="outline"
          onClick={() => setIsSettingsOpen(true)}
          className="text-gray-300 hover:text-white hover:bg-gray-700 border-gray-700"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4">
        {/* Input Area */}
        <div className="w-full md:w-1/2 p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-200">
              Prompt
            </label>
            <Textarea
              id="prompt"
              ref={promptInputRef}
              value={config.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-3 min-h-[100px] resize-y
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-200">
              Negative Prompt
            </label>
            <Textarea
              id="negative-prompt"
              ref={negativePromptInputRef}
              value={config.negativePrompt}
              onChange={(e) => handleInputChange('negativePrompt', e.target.value)}
              placeholder="Things to avoid in the image..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-3 min-h-[80px] resize-y
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-200">
              Input Image (Optional)
            </label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            {inputImage && (
              <div className="mt-2">
                <img
                  src={inputImage}
                  alt="Uploaded Input"
                  className="max-w-full h-auto rounded-md border border-gray-700"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className={cn(
                "bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Images"
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-gray-300 hover:text-white hover:bg-gray-700 border-gray-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="w-full md:w-1/2 p-4">
          {loading && (
            <div className="text-center">
              <RotateCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">Generating images...</p>
            </div>
          )}
          {results && results.images.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generated Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {results.images.map((image, index) => (
                    <motion.div
                      key={index}
                      variants={imageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="relative" // Added for absolute positioning of badge
                    >
                      <img
                        src={image}
                        alt={`Generated ${index + 1}`}
                        className="rounded-md border border-gray-700 w-full h-auto"
                      />
                      {results.nsfw[index] && (
                        <div className="absolute top-1 right-1 bg-red-500/80 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          NSFW
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {results && results.images.length === 0 && !loading && !error && (
            <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-md">
              <ImageIcon className="w-12 h-12 mx-auto mb-4" />
              <p>No images generated. Please check your prompt and settings.</p>
            </div>
          )}
        </div>
      </main>

      {/* Settings Panel (Modal) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            ref={settingsRef}
            variants={settingsVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 h-full w-full md:w-80 bg-gray-800 border-l border-gray-700 shadow-lg z-50 p-6 space-y-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Button
                variant="ghost"
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-200">
                  Model
                </label>
                <select
                  id="model"
                  value={config.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-200">
                  Width
                </label>
                <Input
                  id="width"
                  type="number"
                  value={config.width}
                  onChange={(e) => handleInputChange('width', parseInt(e.target.value, 10))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="64"
                  max="2048"
                  step="8"
                />
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-200">
                  Height
                </label>
                <Input
                  id="height"
                  type="number"
                  value={config.height}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value, 10))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="64"
                  max="2048"
                  step="8"
                />
              </div>

              <div>
                <label htmlFor="samples" className="block text-sm font-medium text-gray-200">
                  Samples
                </label>
                <Input
                  id="samples"
                  type="number"
                  value={config.samples}
                  onChange={(e) => handleInputChange('samples', parseInt(e.target.value, 10))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label htmlFor="seed" className="block text-sm font-medium text-gray-200">
                  Seed (Optional)
                </label>
                <Input
                  id="seed"
                  type="number"
                  value={config.seed ?? ''}
                  onChange={(e) => handleSeedChange(e.target.value)}
                  placeholder="Leave blank for random"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="guidance-scale" className="block text-sm font-medium text-gray-200">
                  Guidance Scale
                </label>
                <Input
                  id="guidance-scale"
                  type="number"
                  value={config.guidanceScale}
                  onChange={(e) => handleInputChange('guidanceScale', parseFloat(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="20"
                  step="0.5"
                />
              </div>

              <div>
                <label htmlFor="steps" className="block text-sm font-medium text-gray-200">
                  Steps
                </label>
                <Input
                  id="steps"
                  type="number"
                  value={config.steps}
                  onChange={(e) => handleInputChange('steps', parseInt(e.target.value, 10))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="10"
                  max="150"
                  step="1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageToImageApp;
