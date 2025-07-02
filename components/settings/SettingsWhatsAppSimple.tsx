"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { MessageCircle, Check, AlertCircle, Zap, XCircle, Smartphone, QrCode, RefreshCw, CheckCircle, Loader2, Settings } from 'lucide-react';
import { QRCodeDisplay } from '@/components/ui/qr-code';

interface ClientStatus {
  isReady: boolean;
  isAuthenticating: boolean;
  qrCode?: string;
  sessionExists: boolean;
  isManualMode?: boolean;
}

interface SimpleWhatsAppSettings {
  adminPhoneNumber: string;
  enableOrderNotifications: boolean;
}

export function SettingsWhatsAppSimple() {
  const [settings, setSettings] = useState<SimpleWhatsAppSettings>({
    adminPhoneNumber: '',
    enableOrderNotifications: true,
  });

  const [clientStatus, setClientStatus] = useState<ClientStatus>({
    isReady: false,
    isAuthenticating: false,
    sessionExists: false
  });

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadClientStatus();
    // Poll for connection status every 5 seconds
    const poll = setInterval(() => {
      loadClientStatus();
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('whatsAppSettingsSimple');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const loadClientStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/baileys/status');
      const result = await response.json();
      if (result.success) {
        setClientStatus({
          isReady: result.status.connected,
          isAuthenticating: result.status.connecting,
          sessionExists: result.status.hasClient,
          qrCode: result.qrCode,
          isManualMode: false
        });
        if (result.qrCode) {
          setQrCode(result.qrCode);
        }
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings.adminPhoneNumber) {
      toast.error('Please enter your WhatsApp number');
      return;
    }

    if (!/^\+[1-9]\d{1,14}$/.test(settings.adminPhoneNumber)) {
      toast.error('Please enter a valid phone number with country code (e.g., +251912345678)');
      return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem('whatsAppSettingsSimple', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const connectWhatsApp = async () => {
    setIsConnecting(true);
    setShowQR(false);
    setQrCode(null);

    try {
      // Initialize the Baileys connection
      const response = await fetch('/api/whatsapp/baileys/init', { method: 'POST' });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to initialize connection');
        setIsConnecting(false);
        return;
      }

      // Start polling for the QR code and connection status
      const pollStartTime = Date.now();
      const pollDuration = 60000; // Poll for 60 seconds
      const pollInterval = 2000; // Poll every 2 seconds

      toast.info('Initializing connection... Please wait.', {
        description: 'This can take up to a minute.',
      });

      const poll = setInterval(async () => {
        if (Date.now() - pollStartTime > pollDuration) {
          clearInterval(poll);
          setIsConnecting(false);
          toast.error('Connection timed out', {
            description: 'Could not get a QR code. Please try again.',
          });
          return;
        }

        const statusResponse = await fetch('/api/whatsapp/baileys/status');
        const statusResult = await statusResponse.json();

        if (statusResult.success) {
          if (statusResult.qrCode && !statusResult.status.connected) {
            clearInterval(poll);
            setQrCode(statusResult.qrCode);
            setShowQR(true);
            setIsConnecting(false);
            toast.success('QR Code ready! Scan with your phone.');
          } else if (statusResult.status.connecting) {
            // User has scanned QR code, show different message
            if (qrCode) {
              setShowQR(false);
              setQrCode(null);
              toast.info('QR Code scanned! Connecting...', {
                description: 'Please wait while WhatsApp connects. Do not scan another QR code.',
              });
            }
          } else if (statusResult.status.connected) {
            clearInterval(poll);
            setIsConnecting(false);
            setClientStatus({
              isReady: true,
              isAuthenticating: false,
              sessionExists: true,
              isManualMode: false
            });
            setShowQR(false);
            setQrCode(null);
            toast.success('WhatsApp connected successfully!');
          }
        }
      }, pollInterval);

    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Failed to start WhatsApp connection');
      setIsConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const response = await fetch('/api/whatsapp/baileys/reset', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        toast.success('WhatsApp disconnected');
        setQrCode(null);
        setShowQR(false);
        setClientStatus({
          isReady: false,
          isAuthenticating: false,
          sessionExists: false,
          isManualMode: false
        });
        await loadClientStatus();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  }; const testConnection = async () => {
    if (!settings.adminPhoneNumber) {
      toast.error('Please save your phone number first');
      return;
    }

    setIsTesting(true);
    try {
      console.log('🧪 Testing WhatsApp connection with phone:', settings.adminPhoneNumber);

      // Use the Baileys test endpoint
      const response = await fetch('/api/whatsapp/baileys/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.adminPhoneNumber,
          message: '🧪 Test message from Betty Organic! Your WhatsApp integration is working perfectly! 🎉'
        })
      });

      console.log('🧪 Response status:', response.status);

      const result = await response.json();
      console.log('🧪 Full response:', result);

      if (result.success) {
        toast.success('Test message sent successfully!');
        console.log('✅ Test completed successfully');
        console.log('✅ Message ID:', result.messageId);
        console.log('📱 Check your WhatsApp app for the message');
      } else {
        const errorMsg = result.error || result.message || 'Test failed - no error details provided';
        toast.error(errorMsg);
        console.error('❌ Test failed. Error:', errorMsg);

        // Provide additional context for common errors
        if (errorMsg.includes('phone number')) {
          toast.error('Please check your phone number format. Use international format like +251944113998');
        } else if (errorMsg.includes('not connected')) {
          toast.error('WhatsApp not connected. Please scan the QR code first.');
        } else if (errorMsg.includes('authentication')) {
          toast.error('WhatsApp authentication needed. Please scan QR code when it appears.');
        }
      }
    } catch (error) {
      console.error('💥 Test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // More specific error handling
      if (errorMessage.includes('fetch')) {
        toast.error('Network error - please check your connection and try again');
      } else if (errorMessage.includes('JSON')) {
        toast.error('Server response error - please try again or check server logs');
      } else {
        toast.error('Test failed: ' + errorMessage);
      }

      // Log additional debug info
      console.error('💥 Error details:', {
        message: errorMessage,
        type: typeof error,
        error: error
      });
    } finally {
      setIsTesting(false);
    }
  };

  const restartWhatsApp = async () => {
    setIsConnecting(true);
    setShowQR(false);
    setQrCode(null);

    try {
      // Reset and reinitialize the connection
      await fetch('/api/whatsapp/baileys/reset', { method: 'POST' });

      // Wait a moment then initialize again
      setTimeout(async () => {
        const response = await fetch('/api/whatsapp/baileys/init', { method: 'POST' });
        const result = await response.json();

        if (!result.success) {
          toast.error(result.error || 'Failed to restart connection');
          setIsConnecting(false);
          return;
        }

        // Start polling for the new QR code
        const pollStartTime = Date.now();
        const pollDuration = 60000; // Poll for 60 seconds
        const pollInterval = 2000; // Poll every 2 seconds

        toast.info('Restarting connection... Please wait.', {
          description: 'This will generate a fresh QR code.',
        });

        const poll = setInterval(async () => {
          if (Date.now() - pollStartTime > pollDuration) {
            clearInterval(poll);
            setIsConnecting(false);
            toast.error('Connection timed out', {
              description: 'Could not get a QR code. Please try again.',
            });
            return;
          }

          const statusResponse = await fetch('/api/whatsapp/baileys/status');
          const statusResult = await statusResponse.json();

          if (statusResult.success) {
            if (statusResult.qrCode && !statusResult.connected) {
              clearInterval(poll);
              setQrCode(statusResult.qrCode);
              setShowQR(true);
              setIsConnecting(false);
              toast.success('New QR Code ready! Scan with your phone.');
            } else if (statusResult.connected) {
              clearInterval(poll);
              setIsConnecting(false);
              setClientStatus({
                isReady: true,
                isAuthenticating: false,
                sessionExists: true,
                isManualMode: false
              });
              setShowQR(false);
              setQrCode(null);
              toast.success('WhatsApp connected successfully!');
            }
          }
        }, pollInterval);
      }, 1000);

    } catch (error) {
      console.error('Error restarting WhatsApp:', error);
      toast.error('Failed to restart WhatsApp connection');
      setIsConnecting(false);
    }
  };

  const getStatusColor = () => {
    if (clientStatus.isManualMode) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    if (clientStatus.isReady) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
    if (clientStatus.isAuthenticating) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  };

  const getStatusText = () => {
    if (clientStatus.isManualMode) return 'Manual Mode';
    if (clientStatus.isReady) return 'Connected';
    if (clientStatus.isAuthenticating) return 'Connecting...';
    return 'Not Connected';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            WhatsApp Notifications
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Get instant notifications for new orders on your WhatsApp
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status - Enhanced */}
          <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${clientStatus.isReady
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-md'
            : clientStatus.isAuthenticating
              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 shadow-sm'
              : clientStatus.isManualMode
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700'
            }`}>
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${clientStatus.isReady
                  ? 'bg-green-100 dark:bg-green-900/40'
                  : clientStatus.isAuthenticating
                    ? 'bg-yellow-100 dark:bg-yellow-900/40'
                    : clientStatus.isManualMode
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                  {clientStatus.isReady ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : clientStatus.isAuthenticating ? (
                    <Loader2 className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-spin" />
                  ) : clientStatus.isManualMode ? (
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    WhatsApp Integration
                  </p>
                  <p className={`text-sm font-medium ${clientStatus.isReady
                    ? 'text-green-700 dark:text-green-300'
                    : clientStatus.isAuthenticating
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : clientStatus.isManualMode
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {clientStatus.isManualMode
                      ? 'Using manual WhatsApp URLs for messaging'
                      : clientStatus.isReady
                        ? '✅ Ready to send instant order notifications'
                        : clientStatus.isAuthenticating
                          ? '🔄 Connecting to your WhatsApp account...'
                          : '📱 Connect your WhatsApp to get started'
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <Badge className={`${getStatusColor()} text-sm font-semibold px-3 py-1 shadow-sm`}>
                  {getStatusText()}
                </Badge>

                {clientStatus.isReady && (
                  <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Live Connection</span>
                  </div>
                )}
              </div>
            </div>

            {/* Success celebration animation for connected state */}
            {clientStatus.isReady && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-pulse"></div>
            )}
          </div>

          {/* QR Code Section - Enhanced and Elegant */}
          {showQR && qrCode && (
            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full blur-xl"></div>

              <div className="relative space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                      <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Link Your WhatsApp</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium">Connect your WhatsApp to start receiving order notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scan the QR code below with your WhatsApp mobile app</p>
                </div>

                {/* Elegant QR Code Display with animations */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="p-6 bg-white rounded-2xl shadow-xl border-4 border-blue-100 relative">
                      <QRCodeDisplay
                        data={qrCode}
                        size={256}
                        className="rounded-lg"
                        errorCorrectionLevel="M"
                      />

                      {/* Scanning animation overlay */}
                      <div className="absolute inset-0 rounded-2xl">
                        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
                        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse delay-300"></div>
                      </div>
                    </div>

                    {/* Corner frame decorations */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-xl animate-pulse"></div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-xl animate-pulse delay-100"></div>
                    <div className="absolute -bottom-3 -left-3 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-xl animate-pulse delay-200"></div>
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-xl animate-pulse delay-300"></div>

                    {/* Pulsing glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-blue-400/10 animate-ping opacity-75 pointer-events-none"></div>
                  </div>
                </div>

                {/* Step-by-step instructions with enhanced styling */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-gray-700/50 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Open WhatsApp on your phone</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Tap Menu (⋮) → Linked devices</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Tap "Link a device"</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg border border-pink-100 dark:border-pink-800">
                      <div className="flex-shrink-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Scan this QR code</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons and status */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Waiting for scan...</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowQR(false);
                        setTimeout(() => connectWhatsApp(), 100);
                      }}
                      className="flex items-center gap-2 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all duration-200 shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate New QR Code
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={restartWhatsApp}
                      disabled={isConnecting}
                      className="flex items-center gap-2 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 transition-all duration-200 shadow-sm"
                    >
                      {isConnecting ? (
                        <div className="w-4 h-4 border-2 border-orange-600 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Restart Connection
                    </Button>
                  </div>
                </div>

                {/* Helpful tip */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-1 bg-amber-100 dark:bg-amber-900/40 rounded-full">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">💡 Quick Setup Tip</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        QR codes expire after 20 seconds for security. If it times out, simply click "Generate New QR Code" to get a fresh one.
                        Keep WhatsApp Web connected on your computer for the best experience!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="dark:text-gray-200">Your WhatsApp Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+251912345678"
              value={settings.adminPhoneNumber}
              onChange={(e) => setSettings({ ...settings, adminPhoneNumber: e.target.value })}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your WhatsApp number with country code
            </p>
          </div>

          {/* Enable Notifications */}
          <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-800/50">
            <div>
              <p className="font-medium dark:text-gray-200">Order Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive WhatsApp messages when new orders are placed
              </p>
            </div>
            <Switch
              checked={settings.enableOrderNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableOrderNotifications: checked })
              }
            />
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Settings
            </Button>

            {!clientStatus.isReady && !clientStatus.isAuthenticating ? (
              <Button
                variant="outline"
                onClick={connectWhatsApp}
                disabled={isConnecting || clientStatus.isAuthenticating || clientStatus.isReady}
                className="flex items-center gap-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {isConnecting || clientStatus.isAuthenticating ? (
                  <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Connect WhatsApp
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  {isTesting ? (
                    <div className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Send Test Message
                </Button>

                <Button
                  variant="ghost"
                  onClick={disconnectWhatsApp}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* How it Works - Enhanced */}
          <Alert className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-amber-800 dark:text-amber-200">How WhatsApp Integration Works:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700 dark:text-amber-300">
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">1</span>
                    <span>Connect your WhatsApp account once using the QR code</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">2</span>
                    <span>Automatically receive instant order notifications</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">3</span>
                    <span>Works with your regular WhatsApp - no extra app needed</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">4</span>
                    <span>Turn notifications on/off anytime from this panel</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>💡 Pro Tip:</strong> Keep WhatsApp Web connected on your computer for the best experience!
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}