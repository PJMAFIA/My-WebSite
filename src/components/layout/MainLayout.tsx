import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus, 
  Globe, 
  Key, 
  Tag,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from "@/lib/supabase";

interface LayoutProps {
  children: ReactNode;
}

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
  { path: '/admin/promos', label: 'Promo Codes', icon: Tag },
  { path: '/admin/resets', label: 'Reset Requests', icon: Key }, 
  { path: '/admin/announcement', label: 'Announcements', icon: Megaphone },
];

const exchangeRates: Record<string, number> = {
  USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00
};

export function MainLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, logout, isAuthenticated, currency } = useAuthStore() as any; 
  const { balanceRequests } = useBalanceRequestStore();

  const [banner, setBanner] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const hasPendingBalance = !isAdmin && balanceRequests.some(
    (r: any) => r.userId === user?.id && r.status === 'pending'
  );

  useEffect(() => {
    // ✅ Logic to Decide if Banner Should Show
    const checkBanner = async () => {
      // FIX: Used .maybeSingle() instead of .single() to avoid 406 error when no banner exists
      const { data } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('id', 1)
        .single(); // We fetch the row regardless of active status first
      
      // Now we filter in JavaScript to be safe, or handle the null gracefully
      if (!data || !data.is_active) {
        setBanner(null);
        return;
      }

      // 1. Audience Targeting
      if (data.target_audience === 'user' && !isAuthenticated) return setBanner(null);
      if (data.target_audience === 'guest' && isAuthenticated) return setBanner(null);

      // 2. Scheduling
      const now = new Date();
      if (data.start_at && now < new Date(data.start_at)) return setBanner(null);
      if (data.end_at && now > new Date(data.end_at)) return setBanner(null);

      // 3. Dismissal Check
      const dismissedSession = sessionStorage.getItem('banner_dismissed');
      if (data.allow_dismiss && dismissedSession === 'true') {
        setIsDismissed(true);
      }

      setBanner(data);
    };

    checkBanner();

    const channel = supabase.channel('public:system_announcements')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'system_announcements' }, () => {
      checkBanner();
      sessionStorage.removeItem('banner_dismissed');
      setIsDismissed(false);
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatPrice = (amount: number) => {
    const selectedCurrency = currency || 'USD';
    const rate = exchangeRates[selectedCurrency] || 1;
    const converted = amount * rate;
    
    let symbol = '$';
    if (selectedCurrency === 'GBP') symbol = '£';
    if (selectedCurrency === 'INR') symbol = '₹';
    if (selectedCurrency === 'PKR') symbol = 'Rs ';
    if (selectedCurrency === 'BDT') symbol = '৳';

    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CurrencySelector = () => (
    <div className="flex items-center gap-2 px-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currency || 'USD'} onValueChange={(v) => useAuthStore.setState({ currency: v } as any)}>
        <SelectTrigger className="h-8 w-[80px] border-none shadow-none bg-transparent focus:ring-0 px-1 text-xs font-medium text-muted-foreground hover:text-foreground">
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

  const getBannerColor = (type: string) => {
    switch(type) {
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'destructive': return 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-500';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* 📱 Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg hidden xs:inline-block">Universal Store</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pl-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           
            <div className="shrink-0"><CurrencySelector /></div>
            {isAuthenticated && !isAdmin && (
              <Button variant="outline" size="sm" className="flex items-center gap-2 shrink-0" onClick={() => navigate('/add-balance')}>
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-semibold whitespace-nowrap">{formatPrice(user?.balance || 0)}</span>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 z-40 h-full w-64 glass-card border-r border-border/50 transition-transform duration-300 lg:translate-x-0 bg-background/95 backdrop-blur-xl", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border/50">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <span className="font-bold text-lg">Universal Store</span>
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
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="bg-secondary/30 rounded-lg p-2 flex items-center justify-between gap-2">
               <CurrencySelector />
   
            </div>
            {isAuthenticated && user && !isAdmin && (
              <div>
                <Button variant="outline" className="w-full justify-between h-12 border-primary/30 hover:border-primary/50 hover:bg-primary/5" onClick={() => navigate('/add-balance')}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-bold text-primary">{formatPrice(user.balance || 0)}</p>
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
              <div>
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
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {/* ✅ ADVANCED BANNER DISPLAY */}
        <AnimatePresence>
          {banner && !isDismissed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn("w-full px-4 py-3 mb-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 border font-medium text-sm shadow-lg", getBannerColor(banner.type))}
            >
              <div className="flex items-center gap-3 text-center md:text-left w-full md:w-auto justify-center md:justify-start">
                <Megaphone className="h-4 w-4 shrink-0" />
                <span>{banner.message}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* CTA Button */}
                {banner.action_label && banner.action_url && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-background/50 hover:bg-background/80 border-none shadow-none">
                    <Link to={banner.action_url}>
                      {banner.action_label} <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
                
                {/* Dismiss Button */}
                {banner.allow_dismiss && (
                  <button 
                    onClick={() => {
                      setIsDismissed(true);
                      sessionStorage.setItem('banner_dismissed', 'true');
                    }}
                    className="hover:bg-black/10 p-1 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6 lg:p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex text-foreground">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 noise" />
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain" />
            <span className="font-bold text-2xl">Universal Store</span>
          </Link>
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">Premium Software <br /><span className="text-gradient">Licensing Platform</span></h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">Access enterprise-grade software with secure licensing, instant delivery, and 24/7 support.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
       
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
          {children}
        </motion.div>
      </div>
    </div>
  );
}