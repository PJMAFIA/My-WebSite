import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  History, 
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Wallet,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/products', label: 'My Products', icon: Package },
  { path: '/orders', label: 'Order History', icon: History },
  { path: '/balance-history', label: 'Balance History', icon: Wallet }, // 👈 Added
];

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: History },
  { path: '/admin/balance', label: 'Balance Requests', icon: Wallet },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/licenses', label: 'Licenses', icon: Shield },
];

export function MainLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  
  // To show 'pending' indicator, we can check store (optional as it requires fetch first)
  const { balanceRequests } = useBalanceRequestStore();

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const hasPendingBalance = !isAdmin && balanceRequests.some(
    r => r.userId === user?.id && r.status === 'pending'
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg">SaaSify</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && !isAdmin && (
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => navigate('/add-balance')}>
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-semibold">${user?.balance?.toFixed(2) || '0.00'}</span>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 z-40 h-full w-64 glass-card border-r border-border/50 transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border/50">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <div>
                <span className="font-bold text-lg">SaaSify</span>
                {isAdmin && <span className="block text-xs text-primary">Admin Panel</span>}
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && user && !isAdmin && (
            <div className="px-4 pb-2">
              <Button variant="outline" className="w-full justify-between h-12 border-primary/30 hover:border-primary/50 hover:bg-primary/5" onClick={() => navigate('/add-balance')}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-bold text-primary">${user.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground"><Plus className="h-3 w-3" /></div>
              </Button>
              {hasPendingBalance && (
                <p className="text-xs text-yellow-500 mt-2 px-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Payment pending approval
                </p>
              )}
            </div>
          )}

          {isAuthenticated && user && (
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-2 justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6 lg:p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 noise" />
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="font-bold text-2xl">SaaSify</span>
          </Link>
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">Premium Software <br /><span className="text-gradient">Licensing Platform</span></h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">Access enterprise-grade software with secure licensing, instant delivery, and 24/7 support.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
          {children}
        </motion.div>
      </div>
    </div>
  );
}