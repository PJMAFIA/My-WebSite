import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Key, 
  Copy, 
  Check, 
  Download, 
  PlayCircle,
  RefreshCw,
  ShoppingBag,
  Clock,
  TrendingUp,
  Loader2,
  Wallet
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useAuthStore, 
  useOrderStore, 
  useProductStore, 
  formatDate, 
  formatPlan 
} from '@/store';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore();
  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      console.log("🔄 Dashboard: Fetching fresh data...");
      await Promise.all([
        fetchOrders(), 
        fetchProducts(),
        refreshUser()
      ]);
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
    }
  }, [isAuthenticated, fetchOrders, fetchProducts, refreshUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate, loadData]);

  if (!user) return null;

  const isLoading = ordersLoading || productsLoading;
  const completedOrders = orders.filter(order => order.status === 'completed');
  const pendingOrders = orders.filter(order => order.status === 'pending');

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'License key copied to clipboard.' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">Here's an overview of your account.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/shop')} variant="gradient">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Shop
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 💰 Wallet Balance Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card variant="glass" className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${user.balance?.toFixed(2) || '0.00'}</p>
                  <p className="text-muted-foreground text-sm">Wallet Balance</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Products */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="glass">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                  <p className="text-muted-foreground text-sm">Active Products</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Orders */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="glass">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  <p className="text-muted-foreground text-sm">Pending Orders</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Orders */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card variant="glass">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-muted-foreground text-sm">Total Orders</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Purchased Products List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Purchased Products
              </CardTitle>
              <CardDescription>Your active licenses and downloads</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && orders.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : completedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No active products found.</p>
                  <Button variant="outline" onClick={() => navigate('/shop')}>Go to Shop</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map((order) => {
                    const product = getProduct(order.productId);
                    if (!product) return null;

                    // 🛠️ FIX START: Correctly extract nested license key
                    // Supabase returns relations as objects: order.licenses.key
                    const rawOrder = order as any;
                    const actualLicenseKey = rawOrder.licenses?.key || rawOrder.licenseKey;
                    // 🛠️ FIX END

                    return (
                      <div key={order.id} className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Product Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                               {product.image && product.image !== '/placeholder.svg' ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                               ) : (
                                  <span className="text-xl font-bold text-primary">{product.name.charAt(0)}</span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{product.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="active">Active</Badge>
                                <span className="text-sm text-muted-foreground">{formatPlan(order.plan)}</span>
                              </div>
                            </div>
                          </div>

                          {/* License Key */}
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">License Key</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-background rounded-lg text-sm font-mono truncate">
                                {/* Use the extracted key here */}
                                {actualLicenseKey || 'Processing...'}
                              </code>
                              <Button variant="ghost" size="icon" onClick={() => actualLicenseKey && copyToClipboard(actualLicenseKey)}>
                                {copiedKey === actualLicenseKey ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                              </Button>
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && orders.length === 0 ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No orders found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const product = getProduct(order.productId);
                        return (
                          <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="py-3 px-4 font-medium">{product?.name || 'Loading...'}</td>
                            <td className="py-3 px-4 text-muted-foreground">{formatPlan(order.plan)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={order.status as any}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                            <td className="py-3 px-4 font-medium">${order.price.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}