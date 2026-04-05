import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Key, Copy, Check, Download, PlayCircle, Loader2, Search, Terminal, Send
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useOrderStore, useProductStore, formatPlan } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { ResetRequestModal } from '@/components/ResetRequestModal';
import api from '@/lib/api';

export default function MyProductsPage() {
  const { user } = useAuthStore(); 
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [uidInputs, setUidInputs] = useState<Record<string, string>>({});
  const [isSubmittingUid, setIsSubmittingUid] = useState<string | null>(null);

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
    toast({ title: 'Copied!', description: 'Copied to clipboard.', className: "bg-emerald-500 text-white border-none" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const handleSendUID = async (orderId: string) => {
      const uid = uidInputs[orderId];
      if (!uid || uid.trim() === '') {
          toast({ title: "UID Required", description: "Please enter your UID before sending.", variant: "destructive" });
          return;
      }

      setIsSubmittingUid(orderId);
      try {
          await api.post('/orders/submit-uid', { orderId, uid });
          toast({ title: "UID Sent!", description: "Admin has received your UID for activation.", className: "bg-emerald-500 text-white border-none" });
          await fetchOrders(); 
      } catch (error: any) {
          toast({ title: "Failed to send", description: error.response?.data?.message || "An error occurred.", variant: "destructive" });
      } finally {
          setIsSubmittingUid(null);
      }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10">
        
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
                
                const rawOrder = order as any;
                const actualLicenseKey = rawOrder.license?.key || rawOrder.licenses?.key || rawOrder.license_obj?.key || rawOrder.licenseKey;
                const isBypassEmulator = product.name === 'Bypass Emulator';

                // ✅ 3-STATE UID LOGIC
                const hasVerifiedUid = order.transactionId?.includes('UID_VERIFIED:');
                const hasPendingUid = !hasVerifiedUid && order.transactionId?.includes('UID:');
                
                let savedUid = null;
                if (hasVerifiedUid) savedUid = order.transactionId.split('UID_VERIFIED:')[1].trim();
                else if (hasPendingUid) savedUid = order.transactionId.split('UID:')[1].trim();

                return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="overflow-hidden bg-black/40 border-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] backdrop-blur-xl group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />

                        <CardContent className="p-0 relative z-10">
                        <div className="flex flex-col lg:flex-row p-6 md:p-8 gap-8">
                            
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-purple-500/30 transition-colors">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"/>
                                ) : (
                                    <span className="text-4xl font-black text-purple-400">{product.name.charAt(0)}</span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between gap-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">{product.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 inline-block" /> Active
                                    </Badge>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{formatPlan(order.plan)}</span>
                                    <span className="text-gray-600">•</span>
                                    {/* ✅ SHOW LICENSE ID FOR BULK PURCHASES */}
                                    <span className="text-xs font-mono font-bold text-gray-500">ID: {order.id.slice(0, 8)}</span>
                                </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={() => window.open(order.softwareDownloadLink || product.softwareDownloadLink, '_blank')} className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none font-bold">
                                    <Download className="h-4 w-4 mr-2" /> Download
                                </Button>
                                <Button variant="outline" onClick={() => window.open(product.tutorialVideoLink, '_blank')} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-gray-300">
                                    <PlayCircle className="h-4 w-4 mr-2" /> Tutorial
                                </Button>
                                {!isBypassEmulator && (
                                  <Button variant="outline" onClick={() => { setSelectedOrderForReset(order); setResetModalOpen(true); }} className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-gray-300 transition-colors">
                                      <Key className="h-4 w-4 mr-2" /> Reset HWID
                                  </Button>
                                )}
                                </div>
                            </div>

                            {/* CUSTOM UI FOR BYPASS EMULATOR OR NORMAL TERMINAL */}
                            {isBypassEmulator ? (
                                hasVerifiedUid ? (
                                    /* ✅ State 3: Admin Accepted UID */
                                    <div className="relative mt-auto">
                                        <div className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest text-emerald-400 uppercase z-10 flex items-center gap-1">
                                            <Check className="h-3 w-3" /> System Activated
                                        </div>
                                        <div className="bg-[#0a0d14] p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-4 group/terminal">
                                            <div className="flex-1 font-mono text-sm md:text-base text-emerald-400 break-all select-all font-bold">
                                                UID: {savedUid}
                                            </div>
                                        </div>
                                    </div>
                                ) : hasPendingUid ? (
                                    /* ✅ State 2: UID Submitted, Pending */
                                    <div className="relative mt-auto">
                                        <div className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest text-yellow-400 uppercase z-10 flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Pending Activation
                                        </div>
                                        <div className="bg-[#0a0d14] p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between gap-4 group/terminal">
                                            <div className="flex-1 font-mono text-sm md:text-base text-yellow-400 break-all select-all font-bold">
                                                {savedUid}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ✅ State 1: Needs UID Input */
                                    <div className="relative mt-auto">
                                        <div className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest text-cyan-400 uppercase z-10 flex items-center gap-1">
                                            <Send className="h-3 w-3" /> Action Required: Submit UID
                                        </div>
                                        <div className="bg-[#0a0d14] p-2 pl-4 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3 group/terminal">
                                            <Input 
                                                placeholder="Paste your UID here..." 
                                                value={uidInputs[order.id] || ''} 
                                                onChange={(e) => setUidInputs(prev => ({...prev, [order.id]: e.target.value}))}
                                                className="border-none bg-transparent text-white font-mono h-10 shadow-none focus-visible:ring-0 px-0"
                                            />
                                            <Button 
                                                onClick={() => handleSendUID(order.id)}
                                                disabled={isSubmittingUid === order.id}
                                                className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold shrink-0 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                            >
                                                {isSubmittingUid === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to Admin"}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                /* STANDARD TERMINAL FOR NORMAL PRODUCTS */
                                <div className="relative mt-auto">
                                    <div className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest text-purple-400 uppercase z-10 flex items-center gap-1">
                                        <Terminal className="h-3 w-3" /> License Key
                                    </div>
                                    <div className="bg-[#0a0d14] p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4 group/terminal hover:border-purple-500/50 transition-colors">
                                        <div className="flex-1 font-mono text-sm md:text-base text-gray-300 break-all select-all">
                                            {actualLicenseKey || <span className="text-yellow-500 animate-pulse">Processing License...</span>}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 rounded-lg transition-all" onClick={() => actualLicenseKey && copyToClipboard(actualLicenseKey)}>
                                            {copiedKey === actualLicenseKey ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                </div>
                            )}

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