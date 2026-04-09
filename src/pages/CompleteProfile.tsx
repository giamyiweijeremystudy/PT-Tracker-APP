import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const RANKS = ['PVT', 'PV2', 'PFC', 'SPC', 'CPL', 'SGT', 'SSG', 'SFC', 'MSG', '1SG', 'SGM', 'CSM', '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BG', 'MG', 'LTG', 'GEN', 'Other'];

export default function CompleteProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [rank, setRank] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, rank })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Set password if provided
      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;
      }

      // Store auto-login preference
      localStorage.setItem('pt_auto_login', autoLogin ? 'yes' : 'no');

      toast({ title: 'Profile completed!' });
      navigate('/', { replace: true });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Please fill in your details to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <select
                  id="rank"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={rank}
                  onChange={e => setRank(e.target.value)}
                  required
                >
                  <option value="">Select rank</option>
                  {RANKS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
              <p className="text-xs text-muted-foreground">Optional — set a password to also sign in with email</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="autoLogin" className="cursor-pointer">Auto Login</Label>
                <p className="text-xs text-muted-foreground">Stay signed in automatically</p>
              </div>
              <Switch id="autoLogin" checked={autoLogin} onCheckedChange={setAutoLogin} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
