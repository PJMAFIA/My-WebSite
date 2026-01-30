import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
  Product
} from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; // Import API helper

interface ProductFormData {
  name: string;
  description: string;
  prices: {
    '1_day': number;
    '7_days': number;
    '30_days': number;
    'lifetime': number;
  };
  softwareDownloadLink: string;
  tutorialVideoLink: string;
  applyProcess: string;
}

const defaultFormData: ProductFormData = {
  name: '',
  description: '',
  prices: { '1_day': 0, '7_days': 0, '30_days': 0, 'lifetime': 0 },
  softwareDownloadLink: '',
  tutorialVideoLink: '',
  applyProcess: '',
};

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { products, addProduct, updateProduct, fetchProducts, isLoading } = useProductStore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch products on load
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProducts(); 
  }, [isAuthenticated, user, navigate, fetchProducts]);

  if (!user || user.role !== 'admin') return null;

  const handleOpenModal = (product?: Product) => {
    setImageFile(null); // Reset image
    if (product) {
      setEditingProduct(product.id);
      setFormData({
        name: product.name,
        description: product.description,
        prices: product.prices,
        softwareDownloadLink: product.softwareDownloadLink || '',
        tutorialVideoLink: product.tutorialVideoLink || '',
        applyProcess: product.applyProcess || '',
      });
    } else {
      setEditingProduct(null);
      setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(defaultFormData);
    setImageFile(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingProduct) {
        // Edit Mode
        updateProduct(editingProduct, {
          ...formData,
        });
        toast({ title: 'Product Updated', description: 'Product updated successfully.' });
      } else {
        // Create Mode
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('software_name', 'Software Name');
        data.append('price_1_day', formData.prices['1_day'].toString());
        data.append('price_7_days', formData.prices['7_days'].toString());
        data.append('price_30_days', formData.prices['30_days'].toString());
        data.append('price_lifetime', formData.prices['lifetime'].toString());
        data.append('download_link', formData.softwareDownloadLink);
        data.append('tutorial_video_link', formData.tutorialVideoLink);
        data.append('activation_process', formData.applyProcess);

        if (imageFile) {
          data.append('image', imageFile);
        }

        await addProduct(data);
        
        toast({ title: 'Product Created', description: 'New product added successfully.' });
      }
      handleCloseModal();
      fetchProducts(); // Refresh list from backend
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to save product.', 
        variant: 'destructive' 
      });
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;

    try {
      // Call Backend API
      await api.delete(`/products/${productId}`);
      
      // Success Message
      toast({ title: 'Product Deleted', description: 'Product has been removed from database.' });
      
      // Refresh List
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.message || 'Could not delete product.',
        variant: 'destructive'
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Product Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Add, edit, and manage your software products
            </p>
          </div>
          <Button variant="gradient" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="glass" className="h-full">
                <CardContent className="p-6">
                  {/* Product Image */}
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 overflow-hidden relative">
                    {product.image && product.image !== '/placeholder.svg' ? (
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    {Object.entries(product.prices).map(([plan, price]) => (
                      <div key={plan} className="p-2 bg-secondary/50 rounded-lg">
                        <span className="text-muted-foreground capitalize">{plan.replace('_', ' ')}:</span>
                        <span className="ml-1 font-medium">${price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenModal(product)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first product to get started
            </p>
            <Button variant="gradient" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        )}

        {/* Product Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Update the product details below'
                  : 'Fill in the details for your new product'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/30 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile ? (
                    <p className="text-primary font-medium">{imageFile.name}</p>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload cover image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="font-medium">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(['1_day', '7_days', '30_days', 'lifetime'] as const).map(plan => (
                    <div key={plan} className="space-y-2">
                      <Label className="capitalize">{plan.replace('_', ' ')} ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.prices[plan]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          prices: { ...prev.prices, [plan]: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Links & Instructions</h4>
                <div className="space-y-2">
                  <Label htmlFor="downloadLink">Software Download Link</Label>
                  <Input
                    id="downloadLink"
                    value={formData.softwareDownloadLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, softwareDownloadLink: e.target.value }))}
                    placeholder="https://example.com/download"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutorialLink">Tutorial Video Link</Label>
                  <Input
                    id="tutorialLink"
                    value={formData.tutorialVideoLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, tutorialVideoLink: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applyProcess">License Apply Process</Label>
                  <Textarea
                    id="applyProcess"
                    value={formData.applyProcess}
                    onChange={(e) => setFormData(prev => ({ ...prev, applyProcess: e.target.value }))}
                    placeholder="Step-by-step instructions..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="gradient" className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button variant="outline" onClick={handleCloseModal}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}