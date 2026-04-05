import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Trash2,
  Upload,
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
  const [selectedPlan, setSelectedPlan] = useState<string>(''); 
  const [bulkKeys, setBulkKeys] = useState('');
  const [filter, setFilter] = useState<'all' | 'unused' | 'assigned' | 'revoked'>('all');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        key: l.key, 
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

  const handleGenerateSingle = async () => {
    if (!selectedProduct || !selectedPlan) {
      toast({ title: 'Error', description: 'Select a product and duration first.', variant: 'destructive' });
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

  const handleBulkAdd = async () => {
    if (!selectedProduct || !selectedPlan) {
      toast({ title: 'Error', description: 'Select a product and duration first.', variant: 'destructive' });
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

  const handleRevoke = async (licenseId: string) => {
    try {
      await api.delete(`/licenses/${licenseId}`);
      setLicenses(prev => prev.filter(l => l.id !== licenseId));
      toast({ title: 'Deleted', description: 'License removed successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleDeleteAllUnused = async () => {
    const unusedCount = licenses.filter(l => l.status === 'unused').length;
    if (unusedCount === 0 || !confirm(`Delete ALL ${unusedCount} unused keys?`)) return;

    setIsDeleting(true);
    try {
      await api.delete('/licenses/unused'); 
      await fetchLicenses();
      toast({ title: 'Cleanup Complete', description: `Deleted ${unusedCount} unused keys.` });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Updated plan formatter to handle trial durations
  const formatPlanName = (plan: string) => {
    if (!plan) return 'LICENSE';
    return plan.replace('_', ' ').replace('trial', 'TRIAL').toUpperCase();
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

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" /> License Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllUnused} 
              disabled={isDeleting || licenses.filter(l => l.status === 'unused').length === 0}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear Unused
            </Button>
            <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Stock
            </Button>
          </div>
        </div>

        {/* Stock Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licensesByProduct.map(({ product, licenses: productLicenses, unused }) => (
            <Card key={product.id} variant="glass">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary">
                    {product.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{productLicenses.length} total</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={unused > 0 ? 'success' : 'destructive'}>{unused} available</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(product.id); setIsModalOpen(true); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {(['all', 'unused', 'assigned', 'revoked'] as const).map((status) => (
            <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" onClick={() => setFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Table List */}
        <Card variant="glass">
          <CardContent className="p-0 overflow-x-auto">
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
                {filteredLicenses.map((license) => (
                  <tr key={license.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-4 px-6 font-mono text-sm">{license.key}</td>
                    <td className="py-4 px-6"><Badge variant="outline">{formatPlanName(license.plan || 'lifetime')}</Badge></td>
                    <td className="py-4 px-6 font-medium">{getProduct(license.productId)?.name || 'Unknown'}</td>
                    <td className="py-4 px-6"><Badge variant={getStatusColor(license.status) as any}>{license.status}</Badge></td>
                    <td className="py-4 px-6 text-right">
                      {license.status === 'unused' && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRevoke(license.id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ADD STOCK MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Inventory</DialogTitle>
              <DialogDescription>Add License Keys for standard or trial durations.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
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
                      {/* ✅ NEW TRIAL OPTIONS */}
                      <SelectItem value="trial_1_day" className="font-semibold text-primary">Trial: 1 Day</SelectItem>
                      <SelectItem value="trial_2_days" className="font-semibold text-primary">Trial: 2 Days</SelectItem>
                      <SelectItem value="trial_3_days" className="font-semibold text-primary">Trial: 3 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProduct && selectedPlan ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-medium">
                        Adding {formatPlanName(selectedPlan)} Keys
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Bulk Import Keys</Label>
                      <span className="text-xs text-muted-foreground">One per line</span>
                    </div>
                    <Textarea 
                      value={bulkKeys} 
                      onChange={(e) => setBulkKeys(e.target.value)} 
                      placeholder={`KEY-1\nKEY-2`} 
                      rows={6} 
                      className="font-mono text-xs" 
                    />
                    <Button variant="gradient" className="w-full" onClick={handleBulkAdd} disabled={!bulkKeys.trim() || isLoading}>
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Save {formatPlanName(selectedPlan)} Keys
                    </Button>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={handleGenerateSingle} disabled={isLoading}>
                      Generate 1 Random Key Instead
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-dashed border-border">
                  Please select a Product and Duration.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}