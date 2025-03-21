"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("A scenic landscape");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setImage(data.imageUrl);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <Input 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Enter your prompt"
        />
        <Button onClick={generateImage} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {loading && !image && (
        <div className="flex justify-center p-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      )}
      
      {image && (
        <div>
          <img src={image} alt="Generated" className="max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}