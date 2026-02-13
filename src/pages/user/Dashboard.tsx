import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// ✅ FIXED: Added 'ArrowRight' to imports
import { 
  Package, RefreshCw, ShoppingBag, Clock, Wallet, ArrowRight, FileText, CheckCircle, XCircle, Hourglass 
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useOrderStore, useProductStore, useBalanceRequestStore, formatDate } from '@/store';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

// ✅ Exchange Rates (For Wallet Balance conversion)
const exchangeRates: Record<string, number> = { 
  USD: 1, 
  GBP: 0.79, 
  INR: 83.50, 
  PKR: 278.00, 
  BDT: 117.00, 
  NPR: 133.00 
};

const getSymbol = (curr: string) => { 
  switch(curr) { 
    case 'GBP': return '£'; 
    case 'INR': return '₹'; 
    case 'PKR': return 'Rs. '; 
    case 'BDT': return '৳'; 
    case 'NPR': return 'Rs. '; 
    default: return '$'; 
  } 
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // ✅ Get Global Currency for Wallet Display
  const { user, isAuthenticated, refreshUser, currentCurrency } = useAuthStore() as any; 
  
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  
  const { fetchUserRequests, pendingAmount, balanceRequests } = useBalanceRequestStore(); 
  const [resetRequests, setResetRequests] = useState<any[]>([]);

  // 1️⃣ For Wallet Balance (Converts Base USD -> View Currency)
  const convertPrice = (amountInUsd: number) => {
    const selectedCurrency = currentCurrency || user?.currency || 'USD'; 
    const rate = exchangeRates[selectedCurrency] || 1;
    return `${getSymbol(selectedCurrency)}${(Number(amountInUsd) * rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // 2️⃣ For Transactions (Displays Original Currency WITHOUT Conversion)
  const formatRawPrice = (amount: number, currencyCode: string) => {
    return `${getSymbol(currencyCode)}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const getProduct = (id: string) => products.find(p => p.id === id);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await Promise.all([
        fetchOrders(), 
        fetchProducts(),
        refreshUser(),
        fetchUserRequests(), 
        api.get('/resets/my-requests').then(res => setResetRequests(res.data.data)).catch(console.error)
      ]);
    } catch (error) { console.error(error); }
  }, [isAuthenticated, fetchOrders, fetchProducts, refreshUser, fetchUserRequests]);

  // ✅ REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, () => { refreshUser(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balance_requests', filter: `user_id=eq.${user.id}` }, () => { fetchUserRequests(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshUser, fetchUserRequests]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadData();
  }, [isAuthenticated, navigate, loadData]);

  if (!user) return null;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const recentOrders = orders.slice(0, 3);
  const recentResets = resetRequests.slice(0, 3);
  const latestBalanceRequest = balanceRequests[0]; 

  return (
    <MainLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/10 p-8">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
                    <p className="text-muted-foreground max-w-xl">
                        Here's your account overview. You have <span className="font-semibold text-foreground">{completedOrders.length} active products</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={loadData} disabled={isLoading} className="bg-background/50 backdrop-blur-sm">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button onClick={() => navigate('/add-balance')} variant="default" className="shadow-lg shadow-primary/20">
                        <Wallet className="h-4 w-4 mr-2" /> Deposit
                    </Button>
                    <Button onClick={() => navigate('/shop')} variant="gradient" className="shadow-lg">
                        <ShoppingBag className="h-4 w-4 mr-2" /> Shop
                    </Button>
                </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        {/* 📊 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label="Wallet Balance" value={convertPrice(user.balance || 0)} color="text-primary" bg="bg-primary/10" delay={0.05} />
          {/* ✅ Pending Funds (Aggregated USD -> View Currency) */}
          <StatCard icon={Hourglass} label="Pending Funds" value={convertPrice(pendingAmount || 0)} color="text-yellow-500" bg="bg-yellow-500/10" delay={0.1} />
          <StatCard icon={Package} label="Active Products" value={completedOrders.length.toString()} color="text-green-500" bg="bg-green-500/10" delay={0.15} />
          <StatCard icon={Clock} label="Pending Orders" value={pendingOrders.length.toString()} color="text-orange-500" bg="bg-orange-500/10" delay={0.2} />
        </div>

        {/* 🔄 LIVE TRANSACTION TRACKER (Using Raw Currency) */}
        {latestBalanceRequest && latestBalanceRequest.status === 'pending' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <Card className="bg-card/60 backdrop-blur-md border-primary/20 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                       <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg text-foreground">Processing Deposit</h3>
                       {/* ✅ Shows original Amount + Symbol (e.g. Rs 500) */}
                       <p className="text-sm text-muted-foreground">
                         ID: <span className="font-mono text-primary">{latestBalanceRequest.transactionId}</span> • 
                         <span className="font-semibold text-foreground ml-1">
                           {formatRawPrice(latestBalanceRequest.amount, latestBalanceRequest.currency || 'USD')}
                         </span>
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 w-full md:w-auto">
                     <div className="flex items-center gap-2 text-sm">
                       <span className="flex items-center gap-1 text-muted-foreground font-medium"><CheckCircle className="h-4 w-4 text-green-500" /> Submitted</span>
                       <div className="w-8 h-px bg-border"></div>
                       <span className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-3 py-1 rounded-full animate-pulse"><Clock className="h-3 w-3" /> Reviewing</span>
                       <div className="w-8 h-px bg-border"></div>
                       <span className="text-muted-foreground/50">Approved</span>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </motion.div>
        )}

        {/* 📦 Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Recent Orders */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="h-full flex flex-col bg-card/50 border-border/50 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Recent Orders</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate('/orders')}>View All</Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {recentOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground"><ShoppingBag className="h-10 w-10 mb-2 opacity-20" /><p className="text-sm">No orders yet.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => {
                                    const prod = getProduct(order.productId);
                                    return (
                                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center border border-border/50 shrink-0">{prod?.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-contain p-1" /> : <Package className="h-5 w-5 text-muted-foreground"/>}</div>
                                                <div className="min-w-0"><p className="font-medium text-sm truncate">{prod?.name || 'Unknown Product'}</p><p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p></div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm">{convertPrice(order.price)}</p>
                                                <Badge variant={order.status === 'completed' ? 'active' : 'outline'} className="text-[10px] px-1.5 h-5">{order.status}</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Right: Support Requests */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Card className="h-full flex flex-col bg-card/50 border-border/50 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Support Requests</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate('/products')}>New Request</Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {recentResets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground"><CheckCircle className="h-10 w-10 mb-2 opacity-20" /><p className="text-sm">No pending requests.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {recentResets.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-background/50 flex items-center justify-center border border-border/50">{req.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500"/> : req.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-500"/> : <Clock className="h-5 w-5 text-yellow-500"/>}</div>
                                            <div><p className="font-medium text-sm">Credential Reset</p><p className="text-xs text-muted-foreground truncate max-w-[150px]">{req.products?.name}</p></div>
                                        </div>
                                        <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'approved' ? 'default' : 'destructive'} className="capitalize">{req.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <NavCard title="My Products" desc="Access downloads & licenses" icon={Package} onClick={() => navigate('/products')} delay={0.6}/>
           <NavCard title="Order History" desc="View invoices & transactions" icon={Clock} onClick={() => navigate('/orders')} delay={0.7}/>
           <NavCard title="Add Funds" desc="Top up your wallet instantly" icon={Wallet} onClick={() => navigate('/add-balance')} delay={0.8}/>
        </div>
      </div>
    </MainLayout>
  );
}

const StatCard = ({ icon: Icon, label, value, color, bg, delay }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card className="hover:shadow-md transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon className={`h-6 w-6 ${color}`} /></div>
        <div><p className="text-2xl font-bold tracking-tight">{value}</p><p className="text-sm text-muted-foreground font-medium">{label}</p></div>
      </CardContent>
    </Card>
  </motion.div>
);

const NavCard = ({ title, desc, icon: Icon, onClick, delay }: any) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="cursor-pointer group" onClick={onClick}>
        <Card className="h-full bg-gradient-to-br from-card to-background hover:border-primary/50 transition-all border-border/50 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" /></div><div><h3 className="font-bold text-lg">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div></div><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" /></CardContent>
        </Card>
    </motion.div>
);