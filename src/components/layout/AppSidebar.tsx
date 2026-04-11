import { LayoutDashboard, Calculator, User, LogOut, Shield, Settings, Activity, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mainItems = [
  { title: 'Dashboard',            url: '/',            icon: LayoutDashboard },
  { title: 'Profile & Statistics', url: '/profile',     icon: User            },
  { title: 'Calculators',          url: '/calculators', icon: Calculator      },
  { title: 'Activities',           url: '/activities',  icon: Activity        },
  { title: 'Teams', url: '/teams', icon: Users },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map(item => (
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
  );

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
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

      {/* Main nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>{renderItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — profile + settings + sign out */}
      <SidebarFooter>
        <SidebarMenu>
          {/* Profile row with settings icon */}
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col leading-tight flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{profile?.full_name || 'User'}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">{profile?.rank}</span>
                  </div>
                  <NavLink to="/settings">
                    <Settings className={`h-4 w-4 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-primary' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'}`} />
                  </NavLink>
                </>
              )}
            </div>
          </SidebarMenuItem>

          {/* Sign out */}
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
