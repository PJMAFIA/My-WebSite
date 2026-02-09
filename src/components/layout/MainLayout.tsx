import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Package, History, LogOut, Menu, X, User, Shield, Wallet, Plus, Globe, Key, Tag // ✅ Added Tag Icon
} from 'lucide-react';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LayoutProps { children: ReactNode; }

const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/products', label: 'My Products', icon: Package },
  { path: '/orders', label: 'Order History', icon: History },
  { path: '/balance-history', label: 'Balance History', icon: Wallet },
];

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: History },
  { path: '/admin/balance', label: 'Balance Requests', icon: Wallet },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/licenses', label: 'Licenses', icon: Shield },
  { path: '/admin/promos', label: 'Promo Codes', icon: Tag }, // ✅ Added Link
  { path: '/admin/resets', label: 'Reset Requests', icon: Key },
];

const exchangeRates: Record<string, number> = { USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00 };

export function MainLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, currency, setCurrency } = useAuthStore() as any; 
  const { balanceRequests } = useBalanceRequestStore();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const hasPendingBalance = !isAdmin && balanceRequests.some((r: any) => r.userId === user?.id && r.status === 'pending');

  const handleLogout = () => { logout(); navigate('/'); };

  const formatPrice = (amount: number) => {
    const rate = exchangeRates[currency || 'USD'] || 1;
    const converted = amount * rate;
    let symbol = '$';
    if (currency === 'GBP') symbol = '£';
    if (currency === 'INR') symbol = '₹';
    if (currency === 'PKR') symbol = 'Rs ';
    if (currency === 'BDT') symbol = '৳';
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const CurrencySelector = () => (
    <div className="flex items-center gap-2 px-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currency || 'USD'} onValueChange={(v) => useAuthStore.setState({ currency: v } as any)}>
        <SelectTrigger className="h-8 w-[80px] border-none shadow-none bg-transparent focus:ring-0 px-1 text-xs">
          <SelectValue placeholder="USD" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="GBP">GBP</SelectItem>
          <SelectItem value="INR">INR</SelectItem>
          <SelectItem value="PKR">PKR</SelectItem>
          <SelectItem value="BDT">BDT</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><span className="font-bold text-lg">Universal Store</span></Link>
          <div className="flex items-center gap-2">
            <CurrencySelector />
            {isAuthenticated && !isAdmin && <Button variant="outline" size="sm" onClick={() => navigate('/add-balance')}><Wallet className="h-4 w-4 text-primary" /><span className="font-semibold">{formatPrice(user?.balance || 0)}</span><Plus className="h-3 w-3" /></Button>}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
      </header>
      <aside className={cn("fixed top-0 left-0 z-40 h-full w-64 glass-card border-r border-border/50 transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border/50"><Link to="/" className="flex items-center gap-3"><span className="font-bold text-lg">Universal Store</span>{isAdmin && <span className="block text-xs text-primary">Admin Panel</span>}</Link></div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary")}>{<item.icon className="h-5 w-5" />}<span className="font-medium">{item.label}</span></Link>;
            })}
          </nav>
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="bg-secondary/30 rounded-lg p-1"><CurrencySelector /></div>
            {isAuthenticated && user && !isAdmin && <div><Button variant="outline" className="w-full justify-between h-12" onClick={() => navigate('/add-balance')}><div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><div className="text-left"><p className="text-xs text-muted-foreground">Balance</p><p className="font-bold text-primary">{formatPrice(user.balance || 0)}</p></div></div><Plus className="h-3 w-3" /></Button>{hasPendingBalance && <p className="text-xs text-yellow-500 mt-2 px-1 flex items-center gap-1">Payment pending</p>}</div>}
            {isAuthenticated && user && <Button variant="ghost" className="w-full mt-2 justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>}
          </div>
        </div>
      </aside>
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen"><motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8">{children}</motion.div></main>
    </div>
  );
}

export function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/20"><div className="absolute inset-0 noise" /><div className="relative z-10 flex flex-col justify-center p-12 xl:p-16"><Link to="/" className="flex items-center gap-3 mb-12"><span className="font-bold text-2xl">Universal Store</span></Link><h1 className="text-4xl xl:text-5xl font-bold mb-6">Premium Software <br /><span className="text-gradient">Licensing Platform</span></h1></div></div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">{children}</motion.div></div>
    </div>
  );
}