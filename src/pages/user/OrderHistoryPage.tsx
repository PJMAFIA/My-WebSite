import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Loader2, FileText, ShoppingBag } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useOrderStore, useProductStore, formatDate, formatPlan } from '@/store';
import { InvoiceModal } from '@/components/InvoiceModal';

// Conversion Helper
const exchangeRates: Record<string, number> = { USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00 };
const getSymbol = (curr: string) => {
  switch(curr) { case 'GBP': return '£'; case 'INR': return '₹'; case 'PKR': return 'Rs. '; case 'BDT': return '৳'; default: return '$'; }
};

export default function OrderHistoryPage() {
  const { user, currentCurrency } = useAuthStore() as any; 
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const [search, setSearch] = useState('');

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); fetchProducts(); }, [fetchOrders, fetchProducts]);

  const convertPrice = (amountInUsd: number) => {
    // Fallback to user currency if currentCurrency isn't set
    const selectedCurrency = currentCurrency || user?.currency || 'USD';
    const rate = exchangeRates[selectedCurrency] || 1;
    const converted = Number(amountInUsd) * rate;
    return `${getSymbol(selectedCurrency)}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const filteredOrders = orders.filter(order => {
    const product = products.find(p => p.id === order.productId);
    return (
      order.id.toLowerCase().includes(search.toLowerCase()) || 
      product?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const handleViewInvoice = (order: any) => {
    const fullOrder = { ...order, products: getProduct(order.productId) };
    setSelectedInvoiceOrder(fullOrder);
    setIsInvoiceOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header - Cyber Upgraded */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-black/40 border border-white/[0.05] p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.05] via-transparent to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white tracking-tight">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <History className="h-6 w-6 text-blue-400" />
                    </div>
                    Order Ledger
                </h1>
                <p className="text-gray-400 mt-2 text-sm font-medium">Review your past acquisitions and secure invoices.</p>
            </div>

            <div className="relative w-full md:w-72 z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                    placeholder="Search ID or Product..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-11 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-blue-400/30 focus-visible:border-blue-400/50 transition-all duration-200 rounded-xl" 
                />
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
            
            <CardContent className="p-0 relative z-10">
              <AnimatePresence mode="wait">
                {isLoading && orders.length === 0 ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-blue-400/20 bg-blue-400/5 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                      <p className="text-gray-400 font-medium tracking-wide">Syncing records...</p>
                  </motion.div>
                ) : filteredOrders.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-5 backdrop-blur-md">
                        <ShoppingBag className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-white font-bold text-lg mb-1">No orders found.</p>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">Your acquisition history is currently empty or no results match your search.</p>
                  </motion.div>
                ) : (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Product & Plan</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Total</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order, i) => {
                          const product = getProduct(order.productId);
                          return (
                            <motion.tr 
                              key={order.id} 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              transition={{ delay: i * 0.05 }}
                              className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                            >
                              <td className="py-4 px-6">
                                  <code className="text-xs font-mono font-bold text-gray-400 bg-black/50 border border-white/5 px-2 py-1 rounded group-hover:text-blue-400 transition-colors">
                                      #{order.id.slice(0, 8)}
                                  </code>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{product?.name || 'Unknown Product'}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{formatPlan(order.plan)}</div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-300 font-medium">{formatDate(order.createdAt)}</td>
                              <td className="py-4 px-6">
                                <Badge 
                                  className={`px-2.5 py-0.5 border-none shadow-sm ${
                                    order.status === 'completed' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : order.status === 'pending' 
                                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' 
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}
                                >
                                  {order.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 font-black text-white text-lg drop-shadow-sm group-hover:text-cyan-400 transition-colors">
                                {convertPrice(order.price)}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button 
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                                  onClick={() => handleViewInvoice(order)}
                                >
                                  <FileText className="h-3.5 w-3.5" /> View
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ✅ Pass 'currency' prop here */}
        <InvoiceModal 
          isOpen={isInvoiceOpen} 
          onClose={() => setIsInvoiceOpen(false)} 
          order={selectedInvoiceOrder}
          user={user}
          currency={currentCurrency || user?.currency || 'USD'} 
        />
      </div>
    </MainLayout>
  );
}