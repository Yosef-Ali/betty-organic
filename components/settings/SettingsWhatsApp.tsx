"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageCircle, Check, AlertCircle, Zap, Settings } from 'lucide-react';
import { testWhatsAppConnection } from '@/app/actions/whatsappActions';

interface WhatsAppSettings {
  adminPhoneNumber: string;
  enableOrderNotifications: boolean;
  enableRealTimeNotifications: boolean;
  notificationMessage: string;
  apiProvider: 'cloud-api' | 'manual' | 'twilio' | 'whatsapp-web-js' | 'baileys';
  apiKey?: string;
  apiSecret?: string;
}

export function SettingsWhatsApp() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    adminPhoneNumber: '',
    enableOrderNotifications: true,
    enableRealTimeNotifications: true,
    notificationMessage: 'New order received from Betty Organic App! Order #{display_id}',
    apiProvider: 'cloud-api',
    apiKey: '',
    apiSecret: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('whatsAppSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed
        }));
      } catch (error) {
        console.error('Failed to parse WhatsApp settings:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof WhatsAppSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for international phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const saveSettings = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!settings.adminPhoneNumber) {
      toast.error('Please enter an admin phone number');
      return;
    }

    if (!validatePhoneNumber(settings.adminPhoneNumber)) {
      toast.error('Please enter a valid phone number with country code (e.g., +251912345678)');
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('whatsAppSettings', JSON.stringify(settings));
      
      // Here you could also save to a database or server
      // await updateWhatsAppSettings(settings);
      
      toast.success('WhatsApp settings saved successfully!');
    } catch (error) {
      console.error('Failed to save WhatsApp settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestMessage = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!settings.adminPhoneNumber) {
      toast.error('Please enter and save an admin phone number first');
      return;
    }

    setIsTestSending(true);
    try {
      // Generate test message for free WhatsApp
      const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Time: ${new Date().toLocaleString()}

If you received this message, your WhatsApp integration is working correctly! ✅`;
      
      const whatsappUrl = `https://wa.me/${settings.adminPhoneNumber.replace('+', '')}?text=${encodeURIComponent(testMessage)}`;
      
      // Open WhatsApp with test message
      window.open(whatsappUrl, '_blank');
      
      toast.success('Test WhatsApp opened!', {
        description: 'WhatsApp opened with a test message. You can click send if you want to test it.'
      });
    } catch (error) {
      console.error('Failed to open test message:', error);
      toast.error('Failed to open WhatsApp test message');
    } finally {
      setIsTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Integration
          </CardTitle>
          <CardDescription>
            Configure WhatsApp settings for manual order notifications. Admin can optionally use WhatsApp to notify about orders when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="adminPhone">Admin WhatsApp Number</Label>
            <Input
              id="adminPhone"
              type="tel"
              placeholder="+251912345678"
              value={settings.adminPhoneNumber}
              onChange={(e) => handleInputChange('adminPhoneNumber', e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Enter the admin WhatsApp number with country code (e.g., +251 for Ethiopia)
            </p>
          </div>

          {/* Simplified notice */}
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Free WhatsApp Integration</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This integration works with your regular WhatsApp account. No paid API required.
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send WhatsApp notifications when new orders are placed
                </p>
              </div>
              <Switch
                checked={settings.enableOrderNotifications}
                onCheckedChange={(checked) => handleInputChange('enableOrderNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Real-time Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable instant notifications for better order management
                </p>
              </div>
              <Switch
                checked={settings.enableRealTimeNotifications}
                onCheckedChange={(checked) => handleInputChange('enableRealTimeNotifications', checked)}
              />
            </div>
          </div>

          {/* API Provider Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">API Provider</h3>
            
            <div className="space-y-2">
              <Label htmlFor="apiProvider">WhatsApp Integration Method</Label>
              <Select 
                value={settings.apiProvider} 
                onValueChange={(value) => handleInputChange('apiProvider', value as any)}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select API provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloud-api">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>WhatsApp Cloud API (Meta)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span>Manual (Free)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="twilio">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-600" />
                      <span>Twilio WhatsApp API</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp-web-js">Web.js Service</SelectItem>
                  <SelectItem value="baileys">Baileys Service</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how WhatsApp messages should be sent
              </p>
            </div>

            {/* API Credentials for Cloud API */}
            {settings.apiProvider === 'cloud-api' && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="text-sm font-medium text-blue-900">WhatsApp Cloud API Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="EAAxxxxxxxxxxxx..."
                      value={settings.apiKey || ''}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get this from Meta Developer Console → Your App → WhatsApp → API Setup
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                    <Input
                      id="phoneNumberId"
                      placeholder="102xxxxxxxxxx"
                      value={settings.apiSecret || ''}
                      onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Phone Number ID from Meta Developer Console
                    </p>
                  </div>
                </div>
                <div className="text-xs text-blue-700">
                  <p><strong>Setup Steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 mt-1">
                    <li>Create Meta Developer Account and Facebook App</li>
                    <li>Add WhatsApp product to your app</li>
                    <li>Get temporary access token and phone number ID</li>
                    <li>Add test recipients (up to 5 phone numbers)</li>
                    <li>Enter credentials above and save</li>
                  </ol>
                </div>
              </div>
            )}

            {/* API Credentials for other providers */}
            {(settings.apiProvider === 'twilio' || settings.apiProvider === 'whatsapp-web-js' || settings.apiProvider === 'baileys') && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium">{settings.apiProvider} Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="apiKey">API Key / Account SID</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={settings.apiKey || ''}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiSecret">API Secret / Auth Token</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={settings.apiSecret || ''}
                      onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Message Template */}
          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Notification Message Template</Label>
            <Input
              id="messageTemplate"
              value={settings.notificationMessage}
              onChange={(e) => handleInputChange('notificationMessage', e.target.value)}
              placeholder="New order received! Order #{display_id}"
            />
            <p className="text-sm text-muted-foreground">
              Use {'{display_id}'} to include the order ID in the message
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button 
              variant="outline"
              onClick={sendTestMessage}
              disabled={isTestSending || !settings.adminPhoneNumber}
              className="flex items-center gap-2"
            >
              {isTestSending ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {isTestSending ? 'Sending...' : 'Test WhatsApp'}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-900">How WhatsApp Integration Works</h4>
                <p className="text-sm text-blue-700">
                  WhatsApp integration is completely optional and does not interfere with normal order processing.
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>✅ Customers:</strong> Can optionally share order details via WhatsApp after placing order</p>
                  <p><strong>👨‍💼 Admin:</strong> Can manually use WhatsApp from dashboard to notify about orders when needed</p>
                  <p><strong>📱 No automatic:</strong> Nothing opens automatically - everything is user-initiated</p>
                </div>
                <p className="text-sm text-blue-700">
                  This respects user choice and doesn&apos;t force anyone to use WhatsApp while providing it as an option.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}