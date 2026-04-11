import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Palette, Bell, Globe, Shield, Moon, Sun, KeyRound, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_KEY = 'MECH>AV';

export default function PTSettings() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const secretUnlocked = (location.state as any)?.secretUnlocked === true;
  const isAlreadyAdmin = (profile as any)?.is_admin === true;

  const [darkMode, setDarkMode]           = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [units, setUnits]                 = useState('metric');
  const [language, setLanguage]           = useState('en');
  const [autoSync, setAutoSync]           = useState(true);
  const [strava, setStrava]               = useState(false);

  const [adminKey, setAdminKey]           = useState('');
  const [adminLoading, setAdminLoading]   = useState(false);
  const [adminSuccess, setAdminSuccess]   = useState(false);

  const handleSave = () => {
    toast({ title: 'Settings saved' });
  };

  const handleAdminKey = async () => {
    if (adminKey !== ADMIN_KEY) {
      toast({ title: 'Invalid key', variant: 'destructive' });
      setAdminKey('');
      return;
    }
    setAdminLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user!.id);
    setAdminLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAdminSuccess(true);
      setAdminKey('');
      toast({ title: 'Admin access granted', description: 'You can now create teams.' });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Label>Dark Mode</Label>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Units</Label>
            <Select value={units} onValueChange={setUnits}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Strava Sync</Label>
              <p className="text-xs text-muted-foreground">Auto-sync runs from Strava</p>
            </div>
            <Switch checked={strava} onCheckedChange={setStrava} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Data Sync</Label>
              <p className="text-xs text-muted-foreground">Sync data across devices</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">Save Settings</Button>

      {/* ── Secret admin panel — only visible after 5 taps on settings icon ── */}
      {secretUnlocked && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <KeyRound className="h-4 w-4" /> Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAlreadyAdmin || adminSuccess ? (
              <div className="flex items-center gap-2 text-green-600">
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
                  />
                  <Button onClick={handleAdminKey} disabled={adminLoading} variant="outline">
                    {adminLoading ? '...' : 'Submit'}
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
