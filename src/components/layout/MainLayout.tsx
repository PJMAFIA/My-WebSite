import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Package, History, LogOut, Menu, 
  X, User, Shield, Wallet, Plus, Globe, Key, Tag, Megaphone, ArrowRight, Languages
} from 'lucide-react';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from "@/lib/supabase";

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
  { path: '/admin/promos', label: 'Promo Codes', icon: Tag },
  { path: '/admin/resets', label: 'Reset Requests', icon: Key }, 
  { path: '/admin/announcement', label: 'Announcements', icon: Megaphone },
];

const exchangeRates: Record<string, number> = {
  USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00, NPR: 133.00
};

export function MainLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, logout, isAuthenticated, currentCurrency, setCurrency } = useAuthStore() as any; 
  const { balanceRequests } = useBalanceRequestStore();

  const [banner, setBanner] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const hasPendingBalance = !isAdmin && balanceRequests.some(
    (r: any) => r.userId === user?.id && r.status === 'pending'
  );

  useEffect(() => {
    const checkBanner = async () => {
      const { data } = await supabase.from('system_announcements').select('*').eq('id', 1).maybeSingle(); 
      if (!data || !data.is_active) { setBanner(null); return; }
      if (data.target_audience === 'user' && !isAuthenticated) return setBanner(null);
      if (data.target_audience === 'guest' && isAuthenticated) return setBanner(null);
      const now = new Date();
      if (data.start_at && now < new Date(data.start_at)) return setBanner(null);
      if (data.end_at && now > new Date(data.end_at)) return setBanner(null);
      const dismissedSession = sessionStorage.getItem('banner_dismissed');
      if (data.allow_dismiss && dismissedSession === 'true') { setIsDismissed(true); }
      setBanner(data);
    };

    checkBanner();
    const channel = supabase.channel('public:system_announcements')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'system_announcements' }, () => {
      checkBanner();
      sessionStorage.removeItem('banner_dismissed');
      setIsDismissed(false);
    }).subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); navigate('/'); };

  const formatPrice = (amount: number) => {
    const selectedCurrency = currentCurrency || user?.currency || 'USD';
    const rate = exchangeRates[selectedCurrency] || 1;
    const converted = amount * rate;
    let symbol = '$';
    if (selectedCurrency === 'GBP') symbol = '£';
    if (selectedCurrency === 'INR') symbol = '₹';
    if (selectedCurrency === 'PKR') symbol = 'Rs ';
    if (selectedCurrency === 'BDT') symbol = '৳';
    if (selectedCurrency === 'NPR') symbol = 'Rs '; 
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const LanguageSelector = () => {
    const [currentLang, setCurrentLang] = useState('en');

    useEffect(() => {
      const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
      if (match) {
        const lang = match[2].split('/').pop();
        if (lang) setCurrentLang(lang);
      }
    }, []);

    const handleLanguageChange = (langCode: string) => {
      setCurrentLang(langCode);
      const gtSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (gtSelect) {
        gtSelect.value = langCode;
        gtSelect.dispatchEvent(new Event('change'));
      }
    };

    return (
      <div className="flex items-center gap-2 px-2">
        <Languages className="h-4 w-4 text-purple-400" />
        <Select value={currentLang} onValueChange={handleLanguageChange}>
          <SelectTrigger className="h-8 w-[100px] border-none shadow-none bg-transparent focus:ring-0 px-1 text-xs font-medium text-muted-foreground hover:text-purple-400 transition-colors">
            <SelectValue placeholder="English" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border border-white/10 backdrop-blur-xl z-[9999]">
            <SelectItem value="en" className="focus:bg-purple-500/20 focus:text-purple-400">English</SelectItem>
            <SelectItem value="es" className="focus:bg-purple-500/20 focus:text-purple-400">Español</SelectItem>
            <SelectItem value="fr" className="focus:bg-purple-500/20 focus:text-purple-400">Français</SelectItem>
            <SelectItem value="de" className="focus:bg-purple-500/20 focus:text-purple-400">Deutsch</SelectItem>
            <SelectItem value="zh-CN" className="focus:bg-purple-500/20 focus:text-purple-400">中文</SelectItem>
            <SelectItem value="ar" className="focus:bg-purple-500/20 focus:text-purple-400">العربية</SelectItem>
            <SelectItem value="hi" className="focus:bg-purple-500/20 focus:text-purple-400">हिन्दी</SelectItem>
            <SelectItem value="ru" className="focus:bg-purple-500/20 focus:text-purple-400">Русский</SelectItem>
            <SelectItem value="pt" className="focus:bg-purple-500/20 focus:text-purple-400">Português</SelectItem>
            <SelectItem value="ja" className="focus:bg-purple-500/20 focus:text-purple-400">日本語</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const CurrencySelector = () => (
    <div className="flex items-center gap-2 px-2">
      <Globe className="h-4 w-4 text-cyan-400" />
      <Select value={currentCurrency || 'USD'} onValueChange={(v) => setCurrency(v)}>
        <SelectTrigger className="h-8 w-[80px] border-none shadow-none bg-transparent focus:ring-0 px-1 text-xs font-medium text-muted-foreground hover:text-cyan-400 transition-colors">
          <SelectValue placeholder="USD" />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border border-white/10 backdrop-blur-xl z-[9999]">
          <SelectItem value="USD" className="focus:bg-cyan-500/20 focus:text-cyan-400">USD</SelectItem>
          <SelectItem value="GBP" className="focus:bg-cyan-500/20 focus:text-cyan-400">GBP</SelectItem>
          <SelectItem value="INR" className="focus:bg-cyan-500/20 focus:text-cyan-400">INR</SelectItem>
          <SelectItem value="PKR" className="focus:bg-cyan-500/20 focus:text-cyan-400">PKR</SelectItem>
          <SelectItem value="BDT" className="focus:bg-cyan-500/20 focus:text-cyan-400">BDT</SelectItem>
          <SelectItem value="NPR" className="focus:bg-cyan-500/20 focus:text-cyan-400">NPR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const getBannerColor = (type: string) => {
    switch(type) {
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 'destructive': return 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      default: return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-foreground transition-colors duration-300 font-sans selection:bg-cyan-500/30">
      {/* ── AMBIENT CYBER BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-30" />
      </div>
      
      {/* 📱 Mobile Header (FIXED OVERFLOW ISSUE) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 px-3 sm:px-4 py-3">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button variant="ghost" size="icon" className="-ml-2 text-white hover:bg-white/10" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
              <span className="font-bold text-base sm:text-lg hidden xs:inline-block tracking-tight text-white">Universal Store</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            
            {/* ✅ HIDDEN ON SMALL MOBILE: Language & Currency moved to sidebar to save space */}
            <div className="hidden sm:flex items-center bg-white/5 rounded-lg shrink-0 border border-white/10 p-0.5">
               <LanguageSelector />
               <div className="w-px h-4 bg-white/10 mx-1" />
               <CurrencySelector />
            </div>

            {isAuthenticated && !isAdmin && (
              <Button size="sm" className="flex items-center gap-1.5 shrink-0 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3" onClick={() => navigate('/add-balance')}>
                <Wallet className="h-4 w-4" />
                <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">{formatPrice(user?.balance || 0)}</span>
                <Plus className="h-3 w-3 hidden sm:block" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 z-40 h-full w-64 bg-black/60 backdrop-blur-2xl border-r border-white/10 transition-transform duration-300 lg:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <Link to="/" className="flex items-center gap-3 relative z-10">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <div>
                <span className="font-black text-lg tracking-tight text-white">Universal Store</span>
                {isAdmin && <span className="block text-[10px] font-bold uppercase tracking-widest text-cyan-400 mt-0.5">Admin Panel</span>}
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden", 
                    isActive ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />}
                  <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="font-medium tracking-wide text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-4 bg-black/20">
            
            {/* Translation block stacked above currency (Always available here) */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col gap-2">
               <LanguageSelector />
               <div className="h-px w-full bg-white/5 my-0.5" />
               <CurrencySelector />
            </div>

            {isAuthenticated && user && !isAdmin && (
              <div>
                <Button className="w-full justify-between h-14 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 hover:from-cyan-800/50 hover:to-blue-800/50 border border-cyan-500/30 text-white rounded-xl group transition-all" onClick={() => navigate('/add-balance')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wallet className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-bold">Balance</p>
                      <p className="font-bold text-white text-sm">{formatPrice(user.balance || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] transition-all">
                    <Plus className="h-4 w-4" />
                  </div>
                </Button>
                {hasPendingBalance && (
                  <p className="text-[11px] text-yellow-400 mt-2.5 px-1 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_5px_rgba(250,204,21,0.6)]" />
                    Deposit pending verification
                  </p>
                )}
              </div>
            )}
            {isAuthenticated && user && (
              <div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-2 h-10 justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-3" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen relative z-10 flex flex-col">
        {/* Banner Area */}
        <AnimatePresence>
          {banner && !isDismissed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 lg:px-8 pt-6 lg:pt-8 pb-0"
            >
              <div className={cn("w-full px-5 py-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md", getBannerColor(banner.type))}>
                <div className="flex items-center gap-3 text-center md:text-left w-full md:w-auto justify-center md:justify-start">
                  <Megaphone className="h-5 w-5 shrink-0 animate-bounce" />
                  <span className="font-semibold tracking-wide">{banner.message}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {banner.action_label && banner.action_url && (
                    <Button asChild size="sm" className="h-8 text-xs bg-white/10 hover:bg-white/20 text-inherit border-none shadow-none rounded-lg">
                      <Link to={banner.action_url}>
                        {banner.action_label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  {banner.allow_dismiss && (
                    <button onClick={() => { setIsDismissed(true); sessionStorage.setItem('banner_dismissed', 'true'); }} className="hover:bg-black/20 p-1.5 rounded-full transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="p-6 lg:p-8 flex-1">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] flex text-foreground font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      </div>

      {/* Left Panel (Marketing) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative z-10 border-r border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-transparent" />
        <div className="relative flex flex-col justify-center p-12 xl:p-20">
          <Link to="/" className="flex items-center gap-4 mb-16 inline-block w-fit">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-2xl object-contain shadow-[0_0_20px_rgba(0,240,255,0.3)]" />
            <span className="font-black text-3xl tracking-tight text-white">Universal Store</span>
          </Link>
          <h1 className="text-5xl font-black mb-6 leading-[1.1] text-white">
            Dominate the Game with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Premium Cheats</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-md leading-relaxed font-medium">
            Undetected, secure, and constantly updated. Join the elite tier of players today.
          </p>
          <div className="flex gap-4">
             <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f0ff]"></div>
             <div className="h-1.5 w-4 bg-white/20 rounded-full"></div>
             <div className="h-1.5 w-4 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-[420px]">
          {children}
        </motion.div>
      </div>
    </div>
  );
}