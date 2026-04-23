import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Palette, Bell, Globe, KeyRound, CheckCircle,
  Moon, Sun, Smartphone, Loader2, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_KEY = '57AETI';

// VAPID public key — set VITE_VAPID_PUBLIC_KEY in .env
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function applyDarkMode(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('pt-dark-mode', enabled ? '1' : '0');
}

export function initDarkMode() {
  if (localStorage.getItem('pt-dark-mode') === '1') {
    document.documentElement.classList.add('dark');
  }
}

interface UserSettings {
  dark_mode:   boolean;
  units:       string;
  language:    string;
  push_enabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  dark_mode:    false,
  units:        'metric',
  language:     'en',
  push_enabled: false,
};

export default function PTSettings() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const secretUnlocked = (location.state as any)?.secretUnlocked === true;
  const isAlreadyAdmin = (profile as any)?.is_admin === true;

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const [pushSupported,  setPushSupported]  = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushLoading,    setPushLoading]    = useState(false);

  const [adminKey,     setAdminKey]     = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      const s: UserSettings = {
        dark_mode:    data.dark_mode    ?? false,
        units:        data.units        ?? 'metric',
        language:     data.language     ?? 'en',
        push_enabled: data.push_enabled ?? false,
      };
      setSettings(s);
      applyDarkMode(s.dark_mode);
    } else {
      const savedDark = localStorage.getItem('pt-dark-mode') === '1';
      setSettings(s => ({ ...s, dark_mode: savedDark }));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
    setPushSupported(supported);
    if ('Notification' in window) setPushPermission(Notification.permission);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('user_settings').upsert({
      user_id:      user.id,
      dark_mode:    settings.dark_mode,
      units:        settings.units,
      language:     settings.language,
      push_enabled: settings.push_enabled,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      applyDarkMode(settings.dark_mode);
      toast({ title: 'Settings saved ✓' });
    }
  };

  const handleDarkMode = (enabled: boolean) => {
    setSettings(s => ({ ...s, dark_mode: enabled }));
    applyDarkMode(enabled);
  };

  const handleEnablePush = async (enabled: boolean) => {
    if (!enabled) {
      setSettings(s => ({ ...s, push_enabled: false }));
      return;
    }
    if (!pushSupported) {
      toast({ title: 'Push not supported', description: 'Install the app or use a compatible browser.', variant: 'destructive' });
      return;
    }
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== 'granted') {
        toast({ title: 'Permission denied', description: 'Allow notifications in browser settings.', variant: 'destructive' });
        setPushLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id:  user!.id,
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys.p256dh,
        auth:     subJson.keys.auth,
      }, { onConflict: 'endpoint' });
      if (error) throw error;
      setSettings(s => ({ ...s, push_enabled: true }));
      toast({ title: 'Push notifications enabled ✓' });
    } catch (e: any) {
      toast({ title: 'Could not enable push', description: e.message, variant: 'destructive' });
    }
    setPushLoading(false);
  };

  const handleTestPush = async () => {
    if (!user) return;
    setPushLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-notifications', {
        body: { user_id: user.id, title: '🗓️ Test Notification', body: 'Push notifications are working!', url: '/schedule', channels: ['push'] },
      });
      if (error) throw error;
      toast({ title: 'Test sent!' });
    } catch (e: any) {
      toast({ title: 'Test failed', description: e.message, variant: 'destructive' });
    }
    setPushLoading(false);
  };

  const handleAdminKey = async () => {
    if (adminKey !== ADMIN_KEY) {
      toast({ title: 'Invalid key', variant: 'destructive' });
      setAdminKey('');
      return;
    }
    setAdminLoading(true);
    const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('id', user!.id);
    setAdminLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAdminSuccess(true);
      setAdminKey('');
      toast({ title: 'Admin access granted', description: 'You can now create teams.' });
    }
  };

  const PushStatusBadge = () => {
    if (!pushSupported) return <Badge variant="secondary" className="text-[10px] h-4">Not available</Badge>;
    if (pushPermission === 'denied') return <Badge variant="destructive" className="text-[10px] h-4">Blocked</Badge>;
    if (settings.push_enabled && pushPermission === 'granted') return (
      <Badge className="text-[10px] h-4 bg-green-600 dark:bg-green-500">Active</Badge>
    );
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Appearance */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                {settings.dark_mode
                  ? <Moon className="h-4 w-4 text-indigo-400" />
                  : <Sun className="h-4 w-4 text-amber-500" />}
              </div>
              <div>
                <Label className="text-sm font-medium cursor-pointer">Dark Mode</Label>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  {settings.dark_mode ? 'Dark theme active' : 'Light theme active'}
                </p>
              </div>
            </div>
            <Switch checked={settings.dark_mode} onCheckedChange={handleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Globe className="h-4 w-4 text-primary" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Measurement Units</Label>
            <Select value={settings.units} onValueChange={v => setSettings(s => ({ ...s, units: v }))}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm, km)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, in, mi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Language</Label>
            <Select value={settings.language} onValueChange={v => setSettings(s => ({ ...s, language: v }))}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Smartphone className="h-4 w-4 text-primary" /> Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Push notifications require the app installed on your home screen (iOS/Android) or a supported browser.
                {!VAPID_PUBLIC_KEY && <><br /><span className="text-amber-600 dark:text-amber-400 font-medium">VITE_VAPID_PUBLIC_KEY is not set in .env</span></>}
              </p>
            </div>
          )}

          {pushPermission === 'denied' && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">
                Notifications are blocked. Enable them in: Browser Settings → Site permissions → {window.location.hostname} → Notifications.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium cursor-pointer">Schedule Reminders</Label>
                  <PushStatusBadge />
                </div>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  Notified at 07:00 for today's events
                </p>
              </div>
            </div>
            <Switch
              checked={settings.push_enabled}
              onCheckedChange={handleEnablePush}
              disabled={pushLoading || !pushSupported || pushPermission === 'denied'}
            />
          </div>

          {settings.push_enabled && pushPermission === 'granted' && (
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={handleTestPush} disabled={pushLoading}>
              {pushLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <Bell className="h-3.5 w-3.5 mr-1.5" />}
              Send Test Push
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-11 text-sm font-semibold">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>

      {/* Secret admin panel */}
      {secretUnlocked && (
        <Card className="border-dashed border-muted-foreground/30 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-muted-foreground text-base">
              <KeyRound className="h-4 w-4" /> Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAlreadyAdmin || adminSuccess ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Admin access active</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Enter the admin key to unlock team creation.</p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdminKey()}
                    className="bg-background"
                  />
                  <Button onClick={handleAdminKey} disabled={adminLoading} variant="outline">
                    {adminLoading ? '…' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
