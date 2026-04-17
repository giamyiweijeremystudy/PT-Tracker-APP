import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calculator, Activity, Users } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',   url: '/',            icon: LayoutDashboard },
  { label: 'Calculators', url: '/calculators', icon: Calculator      },
  { label: 'Activities',  url: '/activities',  icon: Activity        },
  { label: 'Teams',       url: '/teams',       icon: Users           },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
      {/* Actual nav buttons — always 64px tall */}
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.url;
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={
                'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ' +
                (active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
              }
            >
              <item.icon className={'h-5 w-5 ' + (active ? 'stroke-[2.5px]' : '')} />
              {item.label}
            </button>
          );
        })}
      </div>
      {/* Fills the safe-area gap below the nav with the same bg colour */}
      <div className="bg-card" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
