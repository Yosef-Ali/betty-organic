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
import { MessageCircle, Check, AlertCircle, Smartphone, Settings, ExternalLink } from 'lucide-react';

interface SimpleWhatsAppSettings {
  adminPhoneNumber: string;
  enableOrderNotifications: boolean;
}

export function SettingsWhatsAppSimple() {
  const [settings, setSettings] = useState<SimpleWhatsAppSettings>({
    adminPhoneNumber: '',
    enableOrderNotifications: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSettings();
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

  const testManualWhatsApp = () => {
    if (!settings.adminPhoneNumber) {
      toast.error('Please save your phone number first');
      return;
    }

    setIsTesting(true);

    try {
      // Create a manual WhatsApp URL
      const message = '🧪 Test message from Betty Organic! Your WhatsApp integration is working perfectly! 🎉';
      const phoneNumber = settings.adminPhoneNumber.replace(/\D/g, ''); // Remove non-digits
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp URL
      window.open(whatsappUrl, '_blank');

      toast.success('WhatsApp opened! Click send to complete the test.');
      console.log('✅ Manual WhatsApp URL generated:', whatsappUrl);
    } catch (error) {
      console.error('💥 Test error:', error);
      toast.error('Failed to generate WhatsApp URL');
    } finally {
      setTimeout(() => setIsTesting(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            WhatsApp Notifications (Manual Mode)
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Send WhatsApp messages manually using automatically generated links
          </CardDescription>

          {/* Manual Mode Information */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <strong>Manual Mode Active:</strong> Due to serverless environment limitations, WhatsApp automation is disabled.
              The system generates WhatsApp links (wa.me) that you can click to send messages manually.
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    Manual WhatsApp Integration
                  </p>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    ✅ Ready to generate WhatsApp links for manual sending
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 text-sm font-semibold px-3 py-1 shadow-sm">
                  Manual Mode
                </Badge>

                <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">Always Ready</span>
                </div>
              </div>
            </div>
          </div>

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
                Generate WhatsApp links when new orders are placed
              </p>
            </div>
            <Switch
              checked={settings.enableOrderNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableOrderNotifications: checked })
              }
            />
          </div>

          {/* Action Buttons */}
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

            <Button
              variant="outline"
              onClick={testManualWhatsApp}
              disabled={isTesting}
              className="flex items-center gap-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {isTesting ? (
                <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Test WhatsApp Link
            </Button>
          </div>

          {/* How Manual Mode Works */}
          <Alert className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-amber-800 dark:text-amber-200">How Manual Mode Works:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700 dark:text-amber-300">
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">1</span>
                    <span>System generates WhatsApp links automatically</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">2</span>
                    <span>Click links to open WhatsApp with pre-filled messages</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">3</span>
                    <span>Works on any device with WhatsApp installed</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200">4</span>
                    <span>No QR codes or authentication required</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>💡 Pro Tip:</strong> Manual mode is perfect for serverless deployments and works reliably across all environments!
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