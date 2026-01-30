import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Clock,
  Key
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useAuthStore, 
  useOrderStore, 
  useProductStore, 
  useLicenseStore,
  formatDate 
} from '@/store';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { orders } = useOrderStore();
  const { products, fetchProducts } = useProductStore(); // Get fetchProducts
  const { licenses } = useLicenseStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    // 🚀 Fetch real data when dashboard loads
    fetchProducts();
    
  }, [isAuthenticated, user, navigate, fetchProducts]);

  if (!user || user.role !== 'admin') return null;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const unusedLicenses = licenses.filter(l => l.status === 'unused');

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Products',
      value: products.length,
      icon: Package,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      title: 'Available Licenses',
      value: unusedLicenses.length,
      icon: Key,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your platform's performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => {
                        const product = getProduct(order.productId);
                        return (
                          <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4">
                              <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                                {order.id}
                              </code>
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {product?.name || 'Unknown'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={order.status as any}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium">
                              ${order.price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </td>
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

        {/* License Stock Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                License Stock Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const productLicenses = licenses.filter(l => l.productId === product.id);
                  const unused = productLicenses.filter(l => l.status === 'unused').length;
                  const assigned = productLicenses.filter(l => l.status === 'assigned').length;
                  
                  return (
                    <div
                      key={product.id}
                      className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                    >
                      <h4 className="font-medium mb-3">{product.name}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Available</span>
                          <Badge variant={unused > 0 ? 'success' : 'destructive'}>
                            {unused}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Assigned</span>
                          <span className="font-medium">{assigned}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">{productLicenses.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && (
                   <p className="text-sm text-muted-foreground col-span-3 text-center">No products found. Add products to see stock.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}