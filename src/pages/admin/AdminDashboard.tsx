import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Clock,
  Key,
  TrendingUp,
  Activity
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
  const { orders, fetchOrders } = useOrderStore(); // Added fetchOrders
  const { products, fetchProducts } = useProductStore();
  const { licenses } = useLicenseStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    // 🚀 FIXED: Fetch BOTH orders and products when dashboard loads
    fetchProducts();
    fetchOrders(true); // Fetch as Admin to see all system orders
    
  }, [isAuthenticated, user, navigate, fetchProducts, fetchOrders]);

  if (!user || user.role !== 'admin') return null;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const unusedLicenses = licenses.filter(l => l.status === 'unused');

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Products',
      value: products.length,
      icon: Package,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Available Licenses',
      value: unusedLicenses.length,
      icon: Key,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10 pb-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-6 bg-black/40 border border-white/[0.05] p-6 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)] shrink-0">
              <Activity className="h-7 w-7 text-cyan-400" /> 
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Admin Command Center</h1>
            <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">System-wide performance and logistics intel</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-black/40 border border-white/[0.05] shadow-xl backdrop-blur-xl group overflow-hidden relative">
                <CardContent className="p-6 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.title}</p>
                    <p className={`text-3xl font-black tracking-tight text-white`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${stat.bg} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl h-full overflow-hidden">
              <CardHeader className="border-b border-white/[0.05] flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-white uppercase tracking-tight">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Recent System Traffic
                </CardTitle>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] uppercase font-black">Live Logs</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No transmissions detected.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Order ID</th>
                          <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Subscriber</th>
                          <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                          <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 6).map((order, i) => {
                          const product = getProduct(order.productId);
                          return (
                            <motion.tr 
                              key={order.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + (i * 0.05) }}
                              className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group"
                            >
                              <td className="py-4 px-6">
                                <code className="text-[10px] font-mono font-bold text-gray-400 bg-black/50 border border-white/5 px-2 py-1 rounded group-hover:text-cyan-400 transition-colors">
                                  #{order.id.slice(0, 8)}
                                </code>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{product?.name || 'Asset Deleted'}</div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{formatDate(order.createdAt)}</div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Badge className={`text-[9px] uppercase font-black tracking-widest border-none px-2 py-0.5 ${
                                  order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                                  order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 animate-pulse' : 
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                  {order.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right font-black text-white group-hover:text-cyan-400 transition-colors">
                                ${order.price.toFixed(2)}
                              </td>
                            </motion.tr>
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-50" />
              <CardHeader className="border-b border-white/[0.05]">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-white uppercase tracking-tight">
                  <Key className="h-5 w-5 text-purple-400" />
                  Inventory Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto custom-scrollbar max-h-[500px]">
                <div className="space-y-4">
                  {products.map((product) => {
                    const productLicenses = licenses.filter(l => l.productId === product.id);
                    const unused = productLicenses.filter(l => l.status === 'unused').length;
                    const assigned = productLicenses.filter(l => l.status === 'assigned').length;

                    return (
                      <div key={product.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                        <h4 className="font-bold text-white text-sm mb-3 truncate">{product.name}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available</span>
                            <Badge className={`text-[10px] font-black uppercase tracking-widest border-none ${unused > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {unused} Keys
                            </Badge>
                          </div>
                          
                          {/* Stock Bar Visualization */}
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                                style={{ width: `${productLicenses.length > 0 ? (assigned / productLicenses.length) * 100 : 0}%` }}
                              />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                            <span>Assigned: {assigned}</span>
                            <span>Total: {productLicenses.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {products.length === 0 && (
                     <div className="text-center py-10">
                        <Package className="h-10 w-10 text-gray-800 mx-auto mb-3" />
                        <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Inventory Empty</p>
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}