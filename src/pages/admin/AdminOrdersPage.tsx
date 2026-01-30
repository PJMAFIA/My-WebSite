import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, Check, X, Eye, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { 
  useAuthStore, 
  useOrderStore, 
  useProductStore, 
  formatDate,
  formatPlan
} from '@/store';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { orders, fetchOrders, updateOrderStatus, isLoading } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const { toast } = useToast();
  
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Fetch Real Data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOrders(true); // true = Admin Mode
    fetchProducts();
  }, [isAuthenticated, user, navigate, fetchOrders, fetchProducts]);

  if (!user || user.role !== 'admin') return null;

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // 2. Handle Approve (Calls Backend)
  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatus(orderId, 'completed');
      toast({
        title: 'Order Approved',
        description: 'License key assigned automatically.',
      });
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.response?.data?.message || 'Check license stock.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Handle Reject
  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatus(orderId, 'rejected');
      toast({
        title: 'Order Rejected',
        description: 'Order marked as rejected.',
      });
      setSelectedOrder(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject order', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const selectedOrderData = orders.find(o => o.id === selectedOrder);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Order Management
            </h1>
            <p className="text-muted-foreground mt-1">Review customer orders</p>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'pending', 'completed', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            {isLoading && orders.length === 0 ? (
               <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Product</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Plan</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const product = getProduct(order.productId);
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/50 hover:bg-secondary/30"
                        >
                          <td className="py-4 px-6">
                            <code className="text-xs bg-secondary/50 px-2 py-1 rounded">{order.id.slice(0, 8)}...</code>
                          </td>
                          <td className="py-4 px-6 font-medium">{product?.name || 'Unknown'}</td>
                          <td className="py-4 px-6 text-muted-foreground">{formatPlan(order.plan)}</td>
                          <td className="py-4 px-6 font-medium">${order.price.toFixed(2)}</td>
                          <td className="py-4 px-6">
                            <Badge variant={order.status as any}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">{formatDate(order.createdAt)}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Review payment and approve</DialogDescription>
            </DialogHeader>
            {selectedOrderData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{getProduct(selectedOrderData.productId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${selectedOrderData.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{selectedOrderData.paymentMethod?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <code className="text-sm">{selectedOrderData.transactionId}</code>
                  </div>
                  
                  {selectedOrderData.licenseKey && (
                    <div className="col-span-2 mt-2 p-3 bg-secondary/30 rounded border border-primary/20">
                      <p className="text-sm text-primary mb-1">Assigned License Key</p>
                      <code className="text-sm font-mono break-all">{selectedOrderData.licenseKey}</code>
                    </div>
                  )}
                </div>

                {/* Screenshot Display */}
                {selectedOrderData.paymentScreenshot && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                    <div className="w-full rounded-lg overflow-hidden border border-border bg-secondary/20">
                      <a href={selectedOrderData.paymentScreenshot} target="_blank" rel="noreferrer">
                        <img 
                          src={selectedOrderData.paymentScreenshot} 
                          alt="Payment Proof" 
                          className="w-full h-auto object-contain max-h-60 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                    <p className="text-xs text-center mt-1 text-muted-foreground">Click image to open full size</p>
                  </div>
                )}

                {/* Actions */}
                {selectedOrderData.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="success" 
                      className="flex-1" 
                      onClick={() => handleApprove(selectedOrderData.id)}
                      disabled={!!processingId}
                    >
                      {processingId === selectedOrderData.id ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1" 
                      onClick={() => handleReject(selectedOrderData.id)}
                      disabled={!!processingId}
                    >
                      {processingId === selectedOrderData.id ? <Loader2 className="animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}