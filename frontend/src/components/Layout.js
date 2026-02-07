import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, UsersThree, ClipboardText, Wallet, Calendar, ChartBar, SignOut, List, X, UserPlus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Головна', path: '/', icon: ChartBar },
    { name: 'Гравці', path: '/players', icon: Users },
    { name: 'Групи', path: '/groups', icon: UsersThree },
    { name: 'Відвідуваність', path: '/attendance', icon: ClipboardText },
    { name: 'Фінанси', path: '/finance', icon: Wallet },
    { name: 'Розклад', path: '/schedule', icon: Calendar },
    { name: 'Аналітика', path: '/group-analytics', icon: ChartBar },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-border flex-col z-40">
        <div className="p-6 border-b border-border">
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-primary">
            Sport CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Панель тренера</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.substring(1) || 'home'}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon size={20} weight={isActive(item.path) ? 'fill' : 'regular'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            onClick={onLogout}
            data-testid="logout-button"
            className="w-full bg-secondary text-white hover:bg-zinc-800 rounded-sm font-medium"
          >
            <SignOut size={20} className="mr-2" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border flex items-center justify-between px-4 z-50">
        <h1 className="font-heading text-xl font-bold uppercase text-primary">Sport CRM</h1>
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="ghost"
          size="icon"
          data-testid="mobile-menu-button"
        >
          {sidebarOpen ? <X size={24} /> : <List size={24} />}
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-border flex-col z-40 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon size={20} weight={isActive(item.path) ? 'fill' : 'regular'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav md:hidden glass-morphism border-t border-border">
        <div className="flex justify-around items-center h-16 px-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.path.substring(1) || 'home'}`}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={22} weight={isActive(item.path) ? 'fill' : 'regular'} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;