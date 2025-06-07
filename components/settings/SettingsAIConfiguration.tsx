'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Key, CheckCircle, XCircle, AlertTriangle, Sparkles, Cpu, Zap, Wand2, Gift, Cloud, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface AIProvider {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  envKey: string;
  testEndpoint?: string;
  freeQuota?: string;
  category: 'free' | 'premium';
}

const AI_PROVIDERS: AIProvider[] = [
  // Free Providers - Perfect for Consistent Style Generation
  {
    key: 'starryai-api',
    name: 'StarryAI',
    description: 'Free API with 100 images + 1000+ consistent styles for product categories',
    icon: <Heart className="h-4 w-4" />,
    badge: 'Free 100 images',
    badgeVariant: 'secondary',
    envKey: 'STARRYAI_API_KEY',
    freeQuota: '100 images + styles',
    category: 'free'
  },
  {
    key: 'deepai-free',
    name: 'DeepAI',
    description: 'Free text2img + img2img API for consistent product photography',
    icon: <Cpu className="h-4 w-4" />,
    badge: 'Free + IMG2IMG',
    badgeVariant: 'secondary',
    envKey: 'DEEPAI_API_KEY',
    freeQuota: 'Free tier',
    category: 'free'
  },
  {
    key: 'huggingface-diffusers',
    name: 'Hugging Face Diffusers',
    description: 'Community-driven free image generation with 75 images per day',
    icon: <Cloud className="h-4 w-4" />,
    badge: 'Free 75/day',
    badgeVariant: 'secondary',
    envKey: 'HUGGINGFACE_API_KEY',
    freeQuota: '75 images/day',
    category: 'free'
  },
  // Premium Providers
  {
    key: 'openai-dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI\'s premium image generation model (requires payment)',
    icon: <Sparkles className="h-4 w-4" />,
    badge: 'Premium',
    badgeVariant: 'default',
    envKey: 'OPENAI_API_KEY',
    testEndpoint: 'https://api.openai.com/v1/models',
    category: 'premium'
  },
  {
    key: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    description: 'Google\'s flagship multimodal AI for professional product photography',
    icon: <Wand2 className="h-4 w-4" />,
    badge: 'Pro',
    badgeVariant: 'default',
    envKey: 'GOOGLE_AI_API_KEY',
    category: 'premium'
  },
  {
    key: 'stability-ai',
    name: 'Stable Diffusion XL',
    description: 'Open-source model from Stability AI with artistic capabilities',
    icon: <Zap className="h-4 w-4" />,
    badge: 'Artistic',
    badgeVariant: 'destructive',
    envKey: 'STABILITY_API_KEY',
    testEndpoint: 'https://api.stability.ai/v1/user/account',
    category: 'premium'
  }
];

interface APIKeyStatus {
  configured: boolean;
  valid?: boolean;
  error?: string;
}

export function SettingsAIConfiguration() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, APIKeyStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Load current API key status on component mount
  useEffect(() => {
    loadAPIKeyStatus();
  }, []);

  const loadAPIKeyStatus = async () => {
    try {
      const response = await fetch('/api/admin/ai-config');
      if (response.ok) {
        const data = await response.json();
        setKeyStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load API key status:', error);
    }
  };

  const handleKeyChange = (envKey: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [envKey]: value }));
  };

  const toggleShowKey = (envKey: string) => {
    setShowKeys(prev => ({ ...prev, [envKey]: !prev[envKey] }));
  };

  const saveAPIKey = async (envKey: string) => {
    const apiKey = apiKeys[envKey];
    if (!apiKey?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envKey, apiKey: apiKey.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setKeyStatus(prev => ({
          ...prev,
          [envKey]: { configured: true, valid: true }
        }));
        setApiKeys(prev => ({ ...prev, [envKey]: '' })); // Clear input after save
        toast({
          title: 'Success',
          description: `${envKey} saved successfully`
        });
      } else {
        throw new Error(data.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save API key',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIKey = async (provider: AIProvider) => {
    const envKey = provider.envKey;
    setIsTesting(prev => ({ ...prev, [envKey]: true }));

    try {
      const response = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.key })
      });

      const data = await response.json();
      
      setKeyStatus(prev => ({
        ...prev,
        [envKey]: {
          configured: true,
          valid: data.success,
          error: data.error
        }
      }));

      toast({
        title: data.success ? 'API Key Valid' : 'API Key Invalid',
        description: data.message || (data.success ? 'Connection successful' : 'Connection failed'),
        variant: data.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: 'Test Failed',
        description: 'Unable to test API connection',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [envKey]: false }));
    }
  };

  const getStatusIcon = (status: APIKeyStatus) => {
    if (!status.configured) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    if (status.valid === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status.valid === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: APIKeyStatus) => {
    if (!status.configured) return 'Not configured';
    if (status.valid === true) return 'Active';
    if (status.valid === false) return 'Invalid';
    return 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI Image Generation Configuration
        </CardTitle>
        <CardDescription>
          Configure API keys for AI image generation providers. These keys are stored securely and used for generating product images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <strong>Security Note:</strong> API keys are encrypted and stored securely. Only administrators can view and modify these settings.
        </div>

        {/* Free Providers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-700">Free AI Providers</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
              Recommended to start
            </Badge>
          </div>
          
          {AI_PROVIDERS.filter(p => p.category === 'free').map((provider) => {
            const status = keyStatus[provider.envKey] || { configured: false };
            const isTestingThisKey = isTesting[provider.envKey];
            
            return (
              <div key={provider.key} className="space-y-4 p-4 border-2 border-green-200 bg-green-50/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {provider.icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{provider.name}</h3>
                        <Badge variant={provider.badgeVariant} className="text-xs">
                          {provider.badge}
                        </Badge>
                        {provider.freeQuota && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                            {provider.freeQuota}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">{getStatusText(status)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={provider.envKey} className="text-sm font-medium">
                      API Key ({provider.envKey})
                    </Label>
                    {status.configured && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testAPIKey(provider)}
                        disabled={isTestingThisKey}
                      >
                        {isTestingThisKey ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={provider.envKey}
                        type={showKeys[provider.envKey] ? 'text' : 'password'}
                        placeholder={status.configured ? '••••••••••••••••' : 'Enter API key'}
                        value={apiKeys[provider.envKey] || ''}
                        onChange={(e) => handleKeyChange(provider.envKey, e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => toggleShowKey(provider.envKey)}
                      >
                        {showKeys[provider.envKey] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveAPIKey(provider.envKey)}
                      disabled={isLoading || !apiKeys[provider.envKey]?.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>

                  {status.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Error: {status.error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Premium Providers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-700">Premium AI Providers</h3>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Enhanced quality
            </Badge>
          </div>

        {AI_PROVIDERS.filter(p => p.category === 'premium').map((provider) => {
          const status = keyStatus[provider.envKey] || { configured: false };
          const isTestingThisKey = isTesting[provider.envKey];
          
          return (
            <div key={provider.key} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {provider.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{provider.name}</h3>
                      <Badge variant={provider.badgeVariant} className="text-xs">
                        {provider.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium">{getStatusText(status)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={provider.envKey} className="text-sm font-medium">
                    API Key ({provider.envKey})
                  </Label>
                  {status.configured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testAPIKey(provider)}
                      disabled={isTestingThisKey}
                    >
                      {isTestingThisKey ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={provider.envKey}
                      type={showKeys[provider.envKey] ? 'text' : 'password'}
                      placeholder={status.configured ? '••••••••••••••••' : 'Enter API key'}
                      value={apiKeys[provider.envKey] || ''}
                      onChange={(e) => handleKeyChange(provider.envKey, e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleShowKey(provider.envKey)}
                    >
                      {showKeys[provider.envKey] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => saveAPIKey(provider.envKey)}
                    disabled={isLoading || !apiKeys[provider.envKey]?.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>

                {status.error && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Error: {status.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Free Provider Setup Guides</h4>
          <div className="grid gap-3 text-sm">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-green-600" />
                <strong>StarryAI (Perfect for Consistent Styles)</strong>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300">
                1. Sign up at <a href="https://starryai.com" target="_blank" className="underline">starryai.com</a><br/>
                2. Apply for API access (free 100 images)<br/>
                3. Upload reference images for each product category<br/>
                4. Generate consistent style variations<br/>
                🎯 <strong>Perfect for:</strong> Fruits/vegetables, bottles, packaged goods
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                <strong>DeepAI (Image-to-Image + Text-to-Image)</strong>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                1. Create account at <a href="https://deepai.org" target="_blank" className="underline">deepai.org</a><br/>
                2. Get free API key from dashboard<br/>
                3. Use img2img for style consistency<br/>
                4. Great for professional product photography<br/>
                🎯 <strong>Best for:</strong> Style transfer from reference images
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-4 w-4 text-orange-600" />
                <strong>Hugging Face (Backup Option)</strong>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                1. Sign up at <a href="https://huggingface.co" target="_blank" className="underline">huggingface.co</a><br/>
                2. Get API token from settings<br/>
                3. 75 free images daily<br/>
                4. Good for general product images
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Default Recommendations</h4>
          <div className="grid gap-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <strong>🎯 For Consistent Styles:</strong> StarryAI (100 free images + 1000+ styles)
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <strong>🔄 For Image-to-Image:</strong> DeepAI (upload reference → generate variations)
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <strong>🍎 For Fruits/Vegetables:</strong> StarryAI artistic styles
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <strong>🍶 For Bottles/Packaging:</strong> DeepAI professional photography
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
