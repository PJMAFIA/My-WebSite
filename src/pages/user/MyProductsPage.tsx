import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Key, Copy, Check, Download, PlayCircle, Loader2, Search, Terminal
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useOrderStore, useProductStore, formatPlan } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { ResetRequestModal } from '@/components/ResetRequestModal';

export default function MyProductsPage() {
  const { user } = useAuthStore(); 
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedOrderForReset, setSelectedOrderForReset] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const activeOrders = orders.filter(order => order.status === 'completed');
  
  const filteredOrders = activeOrders.filter(order => {
    const product = products.find(p => p.id === order.productId);
    return product?.name.toLowerCase().includes(search.toLowerCase());
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'License key copied to clipboard.', className: "bg-emerald-500 text-white border-none" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header - Cyber Upgraded */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-black/40 border border-white/[0.05] p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.05] via-transparent to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
                <h1 className="text-3xl font-black flex items-center gap-3 text-white tracking-tight">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Package className="h-6 w-6 text-purple-400" />
                    </div>
                    My Arsenal
                </h1>
                <p className="text-gray-400 mt-2 text-sm font-medium">Manage and deploy your active software licenses.</p>
            </div>

            <div className="relative w-full md:w-72 z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                    placeholder="Search products..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-11 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus-visible:ring-purple-400/30 focus-visible:border-purple-400/50 transition-all duration-200 rounded-xl" 
                />
            </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
            {isLoading && orders.length === 0 ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-16 h-16 rounded-2xl border border-purple-400/20 bg-purple-400/5 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
                <p className="text-gray-400 font-medium tracking-wide">Syncing licenses...</p>
            </motion.div>
            ) : filteredOrders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center backdrop-blur-md">
                    <Package size={40} className="text-gray-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">No active products</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">You haven't acquired any software yet, or your licenses have expired.</p>
                </div>
            </motion.div>
            ) : (
            <motion.div key="grid" className="grid gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filteredOrders.map((order, i) => {
                const product = getProduct(order.productId);
                if (!product) return null;
                
                // ✅ CRITICAL FIX: Direct extraction mapped perfectly from Zustand
                const actualLicenseKey = order.licenseKey; 

                return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="overflow-hidden bg-black/40 border-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] backdrop-blur-xl group relative">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />

                        <CardContent className="p-0 relative z-10">
                        <div className="flex flex-col lg:flex-row p-6 md:p-8 gap-8">
                            
                            {/* Image Box */}
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-purple-500/30 transition-colors">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"/>
                                ) : (
                                    <span className="text-4xl font-black text-purple-400">{product.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Details & Actions */}
                            <div className="flex-1 flex flex-col justify-between gap-6">
                            
                            {/* Top Row: Info & Buttons */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">{product.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 inline-block" /> Active
                                    </Badge>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{formatPlan(order.plan)} Plan</span>
                                </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                <Button 
                                    onClick={() => window.open(order.softwareDownloadLink || product.softwareDownloadLink, '_blank')}
                                    className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none font-bold"
                                >
                                    <Download className="h-4 w-4 mr-2" /> Download
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.open(product.tutorialVideoLink, '_blank')}
                                    className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-gray-300"
                                >
                                    <PlayCircle className="h-4 w-4 mr-2" /> Tutorial
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => { setSelectedOrderForReset(order); setResetModalOpen(true); }}
                                    className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-gray-300 transition-colors"
                                >
                                    <Key className="h-4 w-4 mr-2" /> Reset HWID
                                </Button>
                                </div>
                            </div>

                            {/* License Terminal Box */}
                            <div className="relative mt-auto">
                                <div className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest text-purple-400 uppercase z-10 flex items-center gap-1">
                                    <Terminal className="h-3 w-3" /> License Key
                                </div>
                                <div className="bg-[#0a0d14] p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4 group/terminal hover:border-purple-500/50 transition-colors">
                                <div className="flex-1 font-mono text-sm md:text-base text-gray-300 break-all select-all">
                                    {actualLicenseKey || <span className="text-yellow-500 animate-pulse">Processing License...</span>}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 shrink-0 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 rounded-lg transition-all" 
                                    onClick={() => actualLicenseKey && copyToClipboard(actualLicenseKey)}
                                >
                                    {copiedKey === actualLicenseKey ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                                </Button>
                                </div>
                            </div>

                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    </motion.div>
                );
                })}
            </motion.div>
            )}
        </AnimatePresence>

        {/* Modal */}
        {selectedOrderForReset && (
          <ResetRequestModal 
            isOpen={resetModalOpen}
            onClose={() => setResetModalOpen(false)}
            orderId={selectedOrderForReset.id}
            productId={selectedOrderForReset.productId || selectedOrderForReset.product_id}
            productName={getProduct(selectedOrderForReset.productId)?.name || 'Product'}
          />
        )}
      </div>
    </MainLayout>
  );
}