"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { MessageCircle, Check, AlertCircle, Zap, Settings, Shield, TrendingUp, CheckCircle, XCircle, Info } from 'lucide-react';
import { testWhatsAppConnection, getWhatsAppDiagnostics } from '@/app/actions/whatsappActions';

interface WhatsAppSettings {
  adminPhoneNumber: string;
  enableOrderNotifications: boolean;
  enableRealTimeNotifications: boolean;
  notificationMessage: string;
  sessionPath?: string;
  authTimeout?: number;
  restartOnAuthFail?: boolean;
}

interface ClientStatus {
  isReady: boolean;
  isAuthenticating: boolean;
  qrCode?: string;
  sessionExists: boolean;
}

export function SettingsWhatsApp() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    adminPhoneNumber: '',
    enableOrderNotifications: true,
    enableRealTimeNotifications: true,
    notificationMessage: 'New order received from Betty Organic App! Order #{display_id}',
    sessionPath: './whatsapp-session',
    authTimeout: 60000,
    restartOnAuthFail: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [clientStatus, setClientStatus] = useState<ClientStatus>({ isReady: false, isAuthenticating: false, sessionExists: false });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Load settings and diagnostics on component mount
  useEffect(() => {
    loadSettings();
    loadDiagnostics();
    loadClientStatus();
  }, []);
  
  // Polling for QR code when authenticating
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (clientStatus.isAuthenticating && !qrCode) {
      // Poll for QR code every 2 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/whatsapp/status');
          const result = await response.json();
          
          if (result.success && result.status.qrCode) {
            setQrCode(result.status.qrCode);
            // Stop polling once we have the QR code
            if (pollInterval) clearInterval(pollInterval);
          } else if (result.success && result.status.isReady) {
            // Client is ready, stop polling
            setClientStatus(result.status);
            setQrCode(null);
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Failed to poll for QR code:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [clientStatus.isAuthenticating, qrCode]);
  
  const loadSettings = () => {
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
  };
  
  const loadDiagnostics = async () => {
    try {
      const result = await getWhatsAppDiagnostics();
      if (result.success) {
        setDiagnostics(result.data);
        if (result.data.clientStatus) {
          setClientStatus(result.data.clientStatus);
        }
      }
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    }
  };

  const loadClientStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const result = await response.json();
      if (result.success) {
        setClientStatus(result.status);
        if (result.status.qrCode) {
          setQrCode(result.status.qrCode);
        }
      }
    } catch (error) {
      console.error('Failed to load client status:', error);
    }
  };

  const initializeClient = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });
      const result = await response.json();
      
      console.log('Initialize response:', result);
      
      if (result.qrCode) {
        console.log('QR Code received, type:', typeof result.qrCode);
        console.log('QR Code starts with:', result.qrCode.substring(0, 50));
        setQrCode(result.qrCode);
        toast.success('QR Code generated! Please scan with WhatsApp mobile app.');
      } else if (result.success) {
        toast.success('WhatsApp client initialized successfully!');
        await loadClientStatus();
      } else {
        toast.error(result.message || 'Failed to initialize client');
      }
    } catch (error) {
      console.error('Failed to initialize client:', error);
      toast.error('Failed to initialize WhatsApp client');
    } finally {
      setIsInitializing(false);
    }
  };

  const logoutClient = async () => {
    try {
      const response = await fetch('/api/whatsapp/logout', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('WhatsApp client logged out successfully!');
        setQrCode(null);
        await loadClientStatus();
      } else {
        toast.error('Failed to logout client');
      }
    } catch (error) {
      console.error('Failed to logout client:', error);
      toast.error('Failed to logout WhatsApp client');
    }
  };

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
      
      // Reload diagnostics after saving
      await loadDiagnostics();
      
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
      const result = await testWhatsAppConnection();
      
      if (result.success) {
        toast.success(result.message);
        if (result.whatsappUrl) {
          // If we got a fallback URL, open it
          window.open(result.whatsappUrl, '_blank');
        }
      } else {
        toast.error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Failed to send test message:', error);
      toast.error('Failed to send test message');
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
            Configure WhatsApp Web.js integration for automated order notifications using your regular WhatsApp account.
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

          {/* WhatsApp Web.js Status */}
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">WhatsApp Web.js Integration</span>
                <Badge variant={clientStatus.isReady ? 'default' : clientStatus.isAuthenticating ? 'secondary' : 'destructive'}>
                  {clientStatus.isReady ? 'Connected' : clientStatus.isAuthenticating ? 'Authenticating' : 'Not Connected'}
                </Badge>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Automated WhatsApp messaging using your regular WhatsApp account via browser automation.
              </p>
            </div>
            
            {/* QR Code Display */}
            {qrCode && (
              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Scan QR Code with WhatsApp Mobile App</h4>
                <div className="flex justify-center">
                  {qrCode.startsWith('data:') ? (
                    // QR code is already a base64 image
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="max-w-xs rounded-lg shadow-sm"
                      style={{ maxWidth: '256px', height: 'auto' }}
                    />
                  ) : (
                    // QR code is raw data, need to generate image
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Loading QR code...</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-yellow-700 mt-2 text-center">
                  Open WhatsApp on your phone → Three dots menu → Linked devices → Link a device
                </p>
              </div>
            )}
            
            {/* Client Actions */}
            <div className="flex gap-2">
              {!clientStatus.isReady && !clientStatus.isAuthenticating && (
                <Button
                  size="sm"
                  onClick={initializeClient}
                  disabled={isInitializing}
                  className="flex items-center gap-2"
                >
                  {isInitializing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {isInitializing ? 'Initializing...' : 'Connect WhatsApp'}
                </Button>
              )}
              
              {clientStatus.isReady && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logoutClient}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Disconnect
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={loadClientStatus}
                className="flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                Refresh Status
              </Button>
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

          {/* WhatsApp Web.js Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">WhatsApp Web.js Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="sessionPath">Session Storage Path</Label>
                <Input
                  id="sessionPath"
                  value={settings.sessionPath || ''}
                  onChange={(e) => handleInputChange('sessionPath', e.target.value)}
                  placeholder="./whatsapp-session"
                />
                <p className="text-sm text-muted-foreground">
                  Path where WhatsApp session data will be stored
                </p>
              </div>
              
              <div>
                <Label htmlFor="authTimeout">Authentication Timeout (ms)</Label>
                <Input
                  id="authTimeout"
                  type="number"
                  value={settings.authTimeout || ''}
                  onChange={(e) => handleInputChange('authTimeout', parseInt(e.target.value) || 60000)}
                  placeholder="60000"
                />
                <p className="text-sm text-muted-foreground">
                  How long to wait for QR code scan (default: 60 seconds)
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Restart on Auth Failure</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically restart client if authentication fails
                  </p>
                </div>
                <Switch
                  checked={settings.restartOnAuthFail || false}
                  onCheckedChange={(checked) => handleInputChange('restartOnAuthFail', checked)}
                />
              </div>
            </div>
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

          {/* Configuration Status */}
          {diagnostics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Configuration Status</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="text-xs"
                >
                  {showDiagnostics ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {diagnostics.validation.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Configuration {diagnostics.validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.capabilities.canSendMessages ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Auto-send {diagnostics.capabilities.canSendMessages ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.capabilities.canReceiveWebhooks ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    Webhooks {diagnostics.capabilities.canReceiveWebhooks ? 'Ready' : 'Not Setup'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {diagnostics.capabilities.hasSecureWebhooks ? (
                    <Shield className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    Security {diagnostics.capabilities.hasSecureWebhooks ? 'Enabled' : 'Basic'}
                  </span>
                </div>
              </div>
              
              {showDiagnostics && (
                <div className="space-y-3">
                  {diagnostics.validation.errors.length > 0 && (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Errors:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {diagnostics.validation.errors.map((error: string, i: number) => (
                            <li key={i} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {diagnostics.validation.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warnings:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {diagnostics.validation.warnings.map((warning: string, i: number) => (
                            <li key={i} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {diagnostics.recommendations.length > 0 && (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendations:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {diagnostics.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <strong>Supported Features:</strong> {diagnostics.capabilities.supportedFeatures.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

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
            
            <Button 
              variant="ghost"
              onClick={loadDiagnostics}
              className="flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Refresh Status
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
                  <p><strong>🤖 Automated:</strong> Messages are sent automatically via WhatsApp Web.js</p>
                  <p><strong>👨‍💼 Admin:</strong> Receives instant notifications for new orders</p>
                  <p><strong>📱 Browser-based:</strong> Uses your regular WhatsApp account via browser automation</p>
                  <p><strong>🔒 Secure:</strong> Session data is stored locally and encrypted</p>
                </div>
                <p className="text-sm text-blue-700">
                  WhatsApp Web.js provides full automation while using your existing WhatsApp account.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}