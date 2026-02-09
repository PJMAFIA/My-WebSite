import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Loader2, FileText } from 'lucide-react';
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
  const { user, currency } = useAuthStore() as any; 
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const [search, setSearch] = useState('');

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); fetchProducts(); }, [fetchOrders, fetchProducts]);

  const convertPrice = (amountInUsd: number) => {
    const selectedCurrency = currency || 'USD';
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><History className="h-8 w-8 text-primary" /> Order History</h1>
            <p className="text-muted-foreground">View all your past transactions and invoices.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Order ID or Product..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <Card variant="glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30 text-left">
                    <tr>
                      <th className="py-4 px-6 font-medium text-muted-foreground">Order ID</th>
                      <th className="py-4 px-6 font-medium text-muted-foreground">Product</th>
                      <th className="py-4 px-6 font-medium text-muted-foreground">Date</th>
                      <th className="py-4 px-6 font-medium text-muted-foreground">Status</th>
                      <th className="py-4 px-6 font-medium text-muted-foreground">Amount</th>
                      <th className="py-4 px-6 font-medium text-muted-foreground text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => {
                      const product = getProduct(order.productId);
                      return (
                        <motion.tr 
                          key={order.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-border/50 hover:bg-secondary/10 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</td>
                          <td className="py-4 px-6">
                            <div className="font-medium">{product?.name || 'Unknown Product'}</div>
                            <div className="text-xs text-muted-foreground">{formatPlan(order.plan)}</div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">{formatDate(order.createdAt)}</td>
                          <td className="py-4 px-6">
                            <Badge variant={order.status === 'completed' ? 'active' : order.status === 'pending' ? 'outline' : 'destructive'}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 font-bold">{convertPrice(order.price)}</td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              className="inline-flex items-center text-xs text-primary hover:underline"
                              onClick={() => handleViewInvoice(order)}
                            >
                              <FileText className="h-3 w-3 mr-1" /> View
                            </button>
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

        {/* ✅ Pass 'currency' prop here */}
        <InvoiceModal 
          isOpen={isInvoiceOpen} 
          onClose={() => setIsInvoiceOpen(false)} 
          order={selectedInvoiceOrder}
          user={user}
          currency={currency || 'USD'} 
        />
      </div>
    </MainLayout>
  );
}