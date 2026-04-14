import { LayoutDashboard, Calculator, User, LogOut, Shield, Settings, Activity, Users, CalendarDays } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

const mainItems = [
  { title: 'Dashboard',            url: '/',             icon: LayoutDashboard },
  { title: 'Profile & Statistics', url: '/profile',      icon: User            },
  { title: 'Calculators',          url: '/calculators',  icon: Calculator      },
  { title: 'Activities',           url: '/activities',   icon: Activity        },
  { title: 'Teams',                url: '/teams',        icon: Users           },
  { title: 'Schedule',             url: '/schedule',     icon: CalendarDays    },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const [settingsTaps, setSettingsTaps] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSettingsTap = () => {
    const next = settingsTaps + 1;
    setSettingsTaps(next);
    if (next >= 5) {
      navigate('/settings', { state: { secretUnlocked: true } });
      setSettingsTaps(0);
    } else {
      navigate('/settings');
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              {!collapsed && <span className="font-bold text-lg">PT App</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col leading-tight flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{profile?.full_name || 'User'}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">{(profile as any)?.rank}</span>
                  </div>
                  <button
                    onClick={handleSettingsTap}
                    className="p-1 rounded hover:bg-sidebar-accent transition-colors"
                    title="Settings"
                  >
                    <Settings className={`h-4 w-4 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-primary' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'}`} />
                  </button>
                </>
              )}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
