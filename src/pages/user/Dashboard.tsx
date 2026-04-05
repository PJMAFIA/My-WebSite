import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="space-y-8 relative z-10">
        
        {/* Header - Cyber Upgraded */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-black/40 border border-white/[0.05] p-8 backdrop-blur-xl shadow-2xl"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.05] via-transparent to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black mb-2 text-white tracking-tight">
                        Welcome back, <span className="text-cyan-400">{user.name}</span>!
                    </h1>
                    <p className="text-gray-400 max-w-xl text-sm font-medium">
                        Command center ready. You have <span className="text-white font-bold px-2 py-0.5 bg-white/10 rounded-md mx-1">{completedOrders.length} active</span> products in your arsenal.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={loadData} 
                        disabled={isLoading} 
                        className="bg-white/[0.02] border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-gray-300 transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button 
                        onClick={() => navigate('/add-balance')} 
                        className="bg-white/10 hover:bg-white/20 text-white border-none shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all"
                    >
                        <Wallet className="h-4 w-4 mr-2 text-gray-300" /> Deposit
                    </Button>
                    <Button 
                        onClick={() => navigate('/shop')} 
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                    >
                        <ShoppingBag className="h-4 w-4 mr-2" /> Shop
                    </Button>
                </div>
            </div>
        </motion.div>

        {/* 📊 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={Wallet} label="Wallet Balance" value={convertPrice(user.balance || 0)} color="text-cyan-400" bg="bg-cyan-500/10" borderHover="hover:border-cyan-500/50" shadowHover="hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]" delay={0.1} />
          <StatCard icon={Hourglass} label="Pending Funds" value={convertPrice(pendingAmount || 0)} color="text-yellow-400" bg="bg-yellow-500/10" borderHover="hover:border-yellow-500/50" shadowHover="hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]" delay={0.2} />
          <StatCard icon={Package} label="Active Products" value={completedOrders.length.toString()} color="text-emerald-400" bg="bg-emerald-500/10" borderHover="hover:border-emerald-500/50" shadowHover="hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]" delay={0.3} />
          <StatCard icon={Clock} label="Pending Orders" value={pendingOrders.length.toString()} color="text-purple-400" bg="bg-purple-500/10" borderHover="hover:border-purple-500/50" shadowHover="hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]" delay={0.4} />
        </div>

        {/* 🔄 LIVE TRANSACTION TRACKER */}
        <AnimatePresence>
        {latestBalanceRequest && latestBalanceRequest.status === 'pending' && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
             <Card className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)] overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
               <CardContent className="p-6">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6 pl-4">
                   <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                       <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg text-white">Deposit Processing</h3>
                       <p className="text-sm text-gray-400 mt-0.5">
                         Ref: <span className="font-mono text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">{latestBalanceRequest.transactionId}</span>
                         <span className="font-bold text-white ml-3">
                           {formatRawPrice(latestBalanceRequest.amount, latestBalanceRequest.currency || 'USD')}
                         </span>
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                     <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                       <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle className="h-4 w-4" /> Sent</span>
                       <div className="w-8 h-px bg-white/20"></div>
                       <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-md border border-yellow-400/20 animate-pulse"><Clock className="h-3.5 w-3.5" /> Reviewing</span>
                       <div className="w-8 h-px bg-white/20"></div>
                       <span className="text-gray-600">Cleared</span>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </motion.div>
        )}
        </AnimatePresence>

        {/* 📦 Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Recent Orders */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="h-full">
                <Card className="h-full flex flex-col bg-black/40 border border-white/[0.05] shadow-xl backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.05]">
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-cyan-400" /> Recent Acquisitions
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10" onClick={() => navigate('/orders')}>View All</Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-4">
                        {recentOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <ShoppingBag className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No intel found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => {
                                    const prod = getProduct(order.productId);
                                    return (
                                        <div key={order.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all duration-300">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                                                    {prod?.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <Package className="h-5 w-5 text-gray-500"/>}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{prod?.name || 'Unknown Product'}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm text-white">{convertPrice(order.price)}</p>
                                                <Badge className={`text-[10px] px-1.5 h-4 mt-1 border-none ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {order.status}
                                                </Badge>
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
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="h-full">
                <Card className="h-full flex flex-col bg-black/40 border border-white/[0.05] shadow-xl backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.05]">
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-400" /> System Logs
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10" onClick={() => navigate('/products')}>New Request</Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-4">
                        {recentResets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <CheckCircle className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">All systems normal.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentResets.map((req) => (
                                    <div key={req.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' : req.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                                                {req.status === 'approved' ? <CheckCircle className="h-5 w-5 text-emerald-400"/> : req.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-400"/> : <Clock className="h-5 w-5 text-yellow-400"/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">Credential Reset</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{req.products?.name}</p>
                                            </div>
                                        </div>
                                        <Badge className={`capitalize text-[10px] px-2 py-0.5 border-none ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : req.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
           <NavCard title="My Arsenal" desc="Access downloads & licenses" icon={Package} onClick={() => navigate('/products')} delay={0.7} />
           <NavCard title="Transaction History" desc="View secure invoices" icon={Clock} onClick={() => navigate('/orders')} delay={0.8} />
           <NavCard title="Top-up Account" desc="Add funds to wallet instantly" icon={Wallet} onClick={() => navigate('/add-balance')} delay={0.9} />
        </div>
      </div>
    </MainLayout>
  );
}

const StatCard = ({ icon: Icon, label, value, color, bg, borderHover, shadowHover, delay }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card className={`overflow-hidden border-white/[0.05] bg-black/40 backdrop-blur-md transition-all duration-300 ${borderHover} ${shadowHover} group`}>
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-4 relative z-10">
          <div className={`w-14 h-14 rounded-2xl ${bg} border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mt-1">{label}</p>
          </div>
        </div>
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      </CardContent>
    </Card>
  </motion.div>
);

const NavCard = ({ title, desc, icon: Icon, onClick, delay }: any) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} className="cursor-pointer group h-full" onClick={onClick}>
        <Card className="h-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-colors duration-500" />
            <CardContent className="p-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                        <Icon className="h-6 w-6 text-gray-400 group-hover:text-cyan-400 transition-colors drop-shadow-md" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
                        <p className="text-xs text-gray-500 font-medium">{desc}</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
            </CardContent>
        </Card>
    </motion.div>
);