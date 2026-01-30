import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Trash2,
  Upload,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  useAuthStore, 
  useProductStore, 
  generateLicenseKey
} from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 

interface License {
  id: string;
  key: string;
  productId: string;
  status: 'unused' | 'assigned' | 'expired' | 'revoked';
  plan?: string;
  createdAt: string;
}

export default function AdminLicensesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  // Selection State
  const [selectedPlan, setSelectedPlan] = useState<string>(''); 
  const [bulkKeys, setBulkKeys] = useState('');
  
  const [filter, setFilter] = useState<'all' | 'unused' | 'assigned' | 'revoked'>('all');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // New state for delete button

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProducts();
    fetchLicenses();
  }, [isAuthenticated, user, navigate, fetchProducts]);

 const fetchLicenses = async () => {
  try {
    const response = await api.get('/licenses');
    const mappedLicenses = response.data.data.map((l: any) => ({
      id: l.id,
      key: l.key, // ✅ CHANGE THIS: 'l.license_key' -> 'l.key'
      productId: l.product_id,
      status: l.status,
      plan: l.plan, 
      createdAt: l.created_at
    }));
    setLicenses(mappedLicenses);
  } catch (error) {
    console.error("Failed to fetch licenses");
  }
};

  if (!user || user.role !== 'admin') return null;

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const filteredLicenses = licenses.filter(license => {
    if (filter === 'all') return true;
    return license.status === filter;
  });

  // --- 1. Generate Random Key ---
  const handleGenerateSingle = async () => {
    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Select a product first.', variant: 'destructive' });
      return;
    }
    if (!selectedPlan) {
      toast({ title: 'Error', description: 'Select a duration (plan) first.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const newKey = generateLicenseKey();
      await api.post('/licenses', {
        productId: selectedProduct,
        keys: [newKey],
        plan: selectedPlan 
      });
      
      toast({ title: 'Success', description: `New ${selectedPlan.replace('_', ' ')} key generated.` });
      fetchLicenses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Bulk Add ---
  const handleBulkAdd = async () => {
    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Select a product first.', variant: 'destructive' });
      return;
    }
    if (!selectedPlan) {
      toast({ title: 'Error', description: 'Select a duration (plan) first.', variant: 'destructive' });
      return;
    }

    const keys = bulkKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0);

    if (keys.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one key.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/licenses', {
        productId: selectedProduct,
        keys: keys,
        plan: selectedPlan
      });

      toast({ title: 'Success', description: `${keys.length} ${selectedPlan.replace('_', ' ')} keys added.` });
      setBulkKeys('');
      setIsModalOpen(false);
      fetchLicenses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Handle Single Delete ---
  const handleRevoke = async (licenseId: string) => {
    const licenseToDelete = licenses.find(l => l.id === licenseId);
    if (licenseToDelete && licenseToDelete.status !== 'unused') {
      toast({ 
        title: 'Cannot Delete', 
        description: 'You can only delete unused keys.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      await api.delete(`/licenses/${licenseId}`);
      setLicenses(prev => prev.filter(l => l.id !== licenseId));
      toast({ title: 'Deleted', description: 'License removed successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete.', variant: 'destructive' });
    }
  };

  // --- 4. Handle Delete ALL Unused (NEW) ---
  const handleDeleteAllUnused = async () => {
    const unusedCount = licenses.filter(l => l.status === 'unused').length;
    
    if (unusedCount === 0) {
      toast({ title: 'No Unused Keys', description: 'There are no unused keys to delete.' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${unusedCount} unused license keys? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Call special 'unused' endpoint
      const response = await api.delete('/licenses/unused'); 
      
      // Refresh list
      await fetchLicenses();
      
      toast({ 
        title: 'Cleanup Complete', 
        description: response.data.message || `Deleted ${unusedCount} unused keys.` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Delete Failed', 
        description: error.response?.data?.message || 'Could not delete keys.', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unused': return 'success';
      case 'assigned': return 'default';
      case 'expired': return 'warning';
      case 'revoked': return 'destructive';
      default: return 'secondary';
    }
  };

  const licensesByProduct = products.map(product => ({
    product,
    licenses: licenses.filter(l => l.productId === product.id),
    unused: licenses.filter(l => l.productId === product.id && l.status === 'unused').length,
  }));

  const formatPlanName = (plan: string) => plan ? plan.replace('_', ' ').toUpperCase() : 'LICENSE';

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" />
              License Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage keys and stock levels
            </p>
          </div>
          <div className="flex gap-2">
            {/* New Delete All Button */}
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllUnused} 
              disabled={isDeleting || licenses.filter(l => l.status === 'unused').length === 0}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear Unused
            </Button>
            
            <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Stock Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licensesByProduct.map(({ product, licenses: productLicenses, unused }) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{product.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{productLicenses.length} total keys</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={unused > 0 ? 'success' : 'destructive'}>{unused} available</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(product.id); setIsModalOpen(true); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {(['all', 'unused', 'assigned', 'revoked'] as const).map((status) => (
            <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" onClick={() => setFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Licenses Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            {filteredLicenses.length === 0 ? (
              <div className="text-center py-16">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No licenses found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Key</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Plan</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Product</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.map((license) => {
                      const product = getProduct(license.productId);
                      return (
                        <motion.tr key={license.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-4 px-6"><code className="text-sm font-mono">{license.key}</code></td>
                          <td className="py-4 px-6"><Badge variant="outline">{license.plan?.replace('_', ' ') || 'Lifetime'}</Badge></td>
                          <td className="py-4 px-6 font-medium">{product?.name || 'Unknown'}</td>
                          <td className="py-4 px-6"><Badge variant={getStatusColor(license.status) as any}>{license.status}</Badge></td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end">
                              {license.status === 'unused' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRevoke(license.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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

        {/* ADD STOCK MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Inventory</DialogTitle>
              <DialogDescription>Add License Keys for a specific duration.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              
              {/* 1. Selection Area */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (Plan)</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger><SelectValue placeholder="Select Duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_day">1 Day</SelectItem>
                      <SelectItem value="7_days">7 Days</SelectItem>
                      <SelectItem value="30_days">30 Days</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Only show inputs if both Product and Plan are selected */}
              {selectedProduct && selectedPlan ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-medium">Adding {formatPlanName(selectedPlan)} Keys</span></div>
                  </div>

                  {/* SECTION B: Bulk Import (Primary Option now) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Bulk Import Keys</Label>
                        <span className="text-xs text-muted-foreground">One key per line</span>
                    </div>
                    <Textarea 
                      value={bulkKeys} 
                      onChange={(e) => setBulkKeys(e.target.value)} 
                      placeholder={`KEY-1\nKEY-2\nKEY-3`} 
                      rows={6} 
                      className="font-mono text-xs" 
                    />
                    <Button variant="gradient" className="w-full" onClick={handleBulkAdd} disabled={!bulkKeys.trim() || isLoading}>
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Save {formatPlanName(selectedPlan)} Keys
                    </Button>
                  </div>

                  {/* SECTION C: Random Key (Utility) */}
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={handleGenerateSingle} disabled={isLoading}>
                      Generate 1 Random Key Instead
                    </Button>
                  </div>

                </motion.div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-dashed">
                  Please select a Product and Duration to add keys.
                </div>
              )}

            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}