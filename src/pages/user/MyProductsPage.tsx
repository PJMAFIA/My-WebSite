import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Key, Copy, Check, Download, PlayCircle, Loader2, Search
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    toast({ title: 'Copied!', description: 'License key copied to clipboard.' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" /> My Products
            </h1>
            <p className="text-muted-foreground">Manage your active software licenses.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading && orders.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-secondary/20 rounded-xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No active products found</h3>
            <p className="text-muted-foreground">Purchased products will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order, i) => {
              const product = getProduct(order.productId);
              if (!product) return null;
              const rawOrder = order as any;
              const actualLicenseKey = rawOrder.licenses?.key || rawOrder.licenseKey;

              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card variant="glass" className="overflow-hidden border-l-4 border-l-primary">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row p-6 gap-6">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 p-2 border border-border/50">
                           {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-contain"/> : <span className="text-2xl font-bold text-primary">{product.name.charAt(0)}</span>}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-xl font-bold">{product.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="active">Active</Badge>
                                <span>•</span>
                                <span>{formatPlan(order.plan)} Plan</span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => window.open(order.softwareDownloadLink || product.softwareDownloadLink, '_blank')}>
                                <Download className="h-4 w-4 mr-2" /> Download
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(product.tutorialVideoLink, '_blank')}>
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="secondary" size="sm" className="text-xs" onClick={() => { setSelectedOrderForReset(order); setResetModalOpen(true); }}>
                                <Key className="h-3 w-3 mr-1" /> Reset Credentials
                              </Button>
                            </div>
                          </div>

                          {/* License Field */}
                          <div className="bg-secondary/50 p-3 rounded-lg border border-border/50 flex items-center gap-3">
                            <div className="flex-1 font-mono text-sm break-all">
                              {actualLicenseKey || 'Processing License...'}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actualLicenseKey && copyToClipboard(actualLicenseKey)}>
                              {copiedKey === actualLicenseKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

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