"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  analyzeAmharicText, 
  formatAmharicDisplay, 
  AMHARIC_FONT_FAMILIES,
  isPrimarilyAmharic 
} from '@/lib/amharic/text-processor';
import { Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface AmharicTextDisplayProps {
  text: string;
  title?: string;
  showAnalysis?: boolean;
  enableFormatting?: boolean;
  className?: string;
}

export function AmharicTextDisplay({ 
  text, 
  title = "Text Content",
  showAnalysis = true,
  enableFormatting = true,
  className = ""
}: AmharicTextDisplayProps) {
  const [formattedText, setFormattedText] = useState(text);
  const [showRawText, setShowRawText] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeAmharicText> | null>(null);

  useEffect(() => {
    if (enableFormatting) {
      setFormattedText(formatAmharicDisplay(text));
    } else {
      setFormattedText(text);
    }

    if (showAnalysis) {
      setAnalysis(analyzeAmharicText(text));
    }
  }, [text, enableFormatting, showAnalysis]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(showRawText ? text : formattedText);
      toast.success('Text copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy text');
    }
  };

  const resetFormatting = () => {
    setFormattedText(text);
    toast.success('Formatting reset');
  };

  const textStyle = {
    fontFamily: AMHARIC_FONT_FAMILIES,
    direction: isPrimarilyAmharic(text) ? 'ltr' as const : 'ltr' as const,
    lineHeight: '1.8',
    fontSize: '16px'
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            {analysis && (
              <Badge 
                variant={analysis.isAmharic ? "default" : "secondary"}
                className="ml-2"
              >
                {analysis.language}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
            >
              {showRawText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showRawText ? 'Formatted' : 'Raw'}
            </Button>
            {enableFormatting && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFormatting}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {analysis && showAnalysis && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">
              {analysis.amharicPercentage.toFixed(1)}% Amharic
            </Badge>
            <Badge variant="outline">
              {analysis.wordCount} words
            </Badge>
            <Badge variant="outline">
              {analysis.characterCount} chars
            </Badge>
            {analysis.validation.issues.length > 0 && (
              <Badge variant="destructive">
                {analysis.validation.issues.length} issues
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div 
          className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border"
          style={textStyle}
        >
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {showRawText ? text : formattedText}
          </pre>
        </div>

        {analysis && analysis.validation.issues.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Text Issues:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {analysis.validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
            {analysis.validation.suggestions.length > 0 && (
              <>
                <h4 className="font-medium text-yellow-800 mt-3 mb-2">Suggestions:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {analysis.validation.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}