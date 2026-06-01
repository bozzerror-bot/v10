import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  ScrollText,
  Settings,
  FlaskConical,
} from 'lucide-react';
import { useAlexStore } from '../store/useAlexStore';

const navItems = [
  { to: '/study', label: 'Study', icon: BookOpen },
  { to: '/', label: 'Dash', icon: LayoutDashboard, end: true },
  { to: '/chart', label: 'Chart', icon: BarChart3 },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/lab', label: 'Lab', icon: FlaskConical },
];

export default function Navbar() {
  const marketStudyComplete = useAlexStore((s) => s.marketStudyComplete);

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-mobile">
        <div className="flex items-center justify-between h-14">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-primary">Alex</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">V8</span>
          </NavLink>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isStudyLink = item.to === '/study';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isStudyLink && !marketStudyComplete && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-background" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
