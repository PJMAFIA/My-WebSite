import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Save, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // ✅ Tabs
import { useAuthStore, useProductStore, Product } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 

// Define Price Structure
interface PriceStructure {
  '1_day': number;
  '7_days': number;
  '30_days': number;
  'lifetime': number;
}

// Extended Form Data to hold all currencies
interface ProductFormData {
  name: string;
  description: string;
  softwareDownloadLink: string;
  tutorialVideoLink: string;
  applyProcess: string;
  // ✅ Prices for all currencies
  prices: PriceStructure; // USD
  prices_gbp: PriceStructure;
  prices_inr: PriceStructure;
  prices_pkr: PriceStructure;
  prices_bdt: PriceStructure;
}

const emptyPrices = { '1_day': 0, '7_days': 0, '30_days': 0, 'lifetime': 0 };

const defaultFormData: ProductFormData = {
  name: '', description: '', softwareDownloadLink: '', tutorialVideoLink: '', applyProcess: '',
  prices: { ...emptyPrices },
  prices_gbp: { ...emptyPrices },
  prices_inr: { ...emptyPrices },
  prices_pkr: { ...emptyPrices },
  prices_bdt: { ...emptyPrices },
};

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { products, addProduct, updateProduct, fetchProducts, isLoading } = useProductStore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [existingImages, setExistingImages] = useState<string[]>([]); 
  
  // ✅ Manual Tab State
  const [activeTab, setActiveTab] = useState<'usd'|'gbp'|'inr'|'pkr'|'bdt'>('usd');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { navigate('/login'); return; }
    fetchProducts(); 
  }, [isAuthenticated, user, navigate, fetchProducts]);

  const handleOpenModal = (product?: Product) => {
    setImageFiles([]); setExistingImages([]);
    if (product) {
      setEditingProduct(product.id);
      setExistingImages(product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
      
      // ✅ Populate Form with existing data + currency prices
      const p = product as any; // Cast to any to avoid interface issues if store not updated
      setFormData({
        name: product.name,
        description: product.description,
        softwareDownloadLink: product.softwareDownloadLink || '',
        tutorialVideoLink: product.tutorialVideoLink || '',
        applyProcess: product.applyProcess || '',
        prices: product.prices,
        prices_gbp: p.currency_prices?.GBP || { ...emptyPrices },
        prices_inr: p.currency_prices?.INR || { ...emptyPrices },
        prices_pkr: p.currency_prices?.PKR || { ...emptyPrices },
        prices_bdt: p.currency_prices?.BDT || { ...emptyPrices },
      });
    } else {
      setEditingProduct(null); setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); setFormData(defaultFormData); setImageFiles([]); setExistingImages([]); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
  const removeNewFile = (index: number) => setImageFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast({ title: 'Error', description: 'Name required.', variant: 'destructive' });

    try {
      const data = new FormData();
      data.append('name', formData.name); data.append('description', formData.description); data.append('software_name', 'Software Name');
      
      // USD Prices (Base columns)
      data.append('price_1_day', formData.prices['1_day'].toString()); 
      data.append('price_7_days', formData.prices['7_days'].toString()); 
      data.append('price_30_days', formData.prices['30_days'].toString()); 
      data.append('price_lifetime', formData.prices['lifetime'].toString());
      
      // ✅ NEW: Send JSON of other currencies
      const currencyPrices = {
        GBP: formData.prices_gbp,
        INR: formData.prices_inr,
        PKR: formData.prices_pkr,
        BDT: formData.prices_bdt,
      };
      data.append('currency_prices', JSON.stringify(currencyPrices));

      data.append('download_link', formData.softwareDownloadLink); 
      data.append('tutorial_video_link', formData.tutorialVideoLink); 
      data.append('activation_process', formData.applyProcess);

      imageFiles.forEach(file => data.append('images', file));
      data.append('existing_images', JSON.stringify(existingImages));

      if (editingProduct) { await updateProduct(editingProduct, data); toast({ title: 'Updated', description: 'Changes saved.' }); } 
      else { await addProduct(data); toast({ title: 'Created', description: 'Product added.' }); }
      handleCloseModal(); fetchProducts(); 
    } catch (error) { toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' }); }
  };

  const handleDelete = async (productId: string) => { if (!confirm('Delete product?')) return; try { await api.delete(`/products/${productId}`); toast({ title: 'Deleted', description: 'Product removed.' }); fetchProducts(); } catch (e) { toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' }); } };

  // Helper to render price inputs for active tab
  const renderPriceInputs = (key: keyof ProductFormData, label: string) => (
    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-secondary/30 rounded-lg border border-border/50">
      {(['1_day', '7_days', '30_days', 'lifetime'] as const).map(plan => (
        <div key={plan} className="space-y-2">
          <Label className="capitalize">{plan.replace('_', ' ')} ({label})</Label>
          <Input 
            type="number" step="0.01" min="0" 
            value={(formData[key] as PriceStructure)[plan]} 
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              [key]: { ...(prev[key] as PriceStructure), [plan]: parseFloat(e.target.value) || 0 } 
            }))} 
          />
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold flex items-center gap-3"><Package className="h-8 w-8 text-primary"/> Product Management</h1><Button onClick={() => handleOpenModal()}><Plus className="h-4 w-4"/> Add Product</Button></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="glass" className="h-full">
                <CardContent className="p-6">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 relative overflow-hidden">
                    <img src={(p.images && p.images[0]) || p.image || '/placeholder.svg'} className="w-full h-full object-cover" />
                    {p.images && p.images.length > 1 && <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1"><ImageIcon className="h-3 w-3"/> {p.images.length}</div>}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{p.name}</h3>
                  <div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenModal(p)}><Edit className="h-4 w-4 mr-2"/> Edit</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4"/></Button></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProduct ? 'Edit' : 'Add'} Product</DialogTitle><DialogDescription>Manage details and pricing.</DialogDescription></DialogHeader>
            <div className="space-y-6">
              {/* Image Manager */}
              <div className="space-y-2"><Label>Images</Label><div className="flex gap-2 mb-2">{existingImages.map((u, i) => <div key={i} className="relative w-16 h-16"><img src={u} className="w-full h-full object-cover rounded"/><button onClick={() => removeExistingImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">x</button></div>)}</div><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed p-4 text-center cursor-pointer">Upload Images</div><input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} />{imageFiles.length > 0 && <div className="text-xs">{imageFiles.length} new files selected</div>}</div>
              
              <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}/></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}/></div>
              
              {/* ✅ Pricing Tabs */}
              <div className="space-y-2">
                <Label>Pricing Configuration</Label>
                <div className="flex gap-1 border-b pb-2 mb-2 overflow-x-auto">
                  {[
                    {id: 'usd', l: 'USD ($)'}, {id: 'gbp', l: 'GBP (£)'}, 
                    {id: 'inr', l: 'INR (₹)'}, {id: 'pkr', l: 'PKR (Rs)'}, {id: 'bdt', l: 'BDT (৳)'}
                  ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>{t.l}</button>
                  ))}
                </div>
                {activeTab === 'usd' && renderPriceInputs('prices', '$')}
                {activeTab === 'gbp' && renderPriceInputs('prices_gbp', '£')}
                {activeTab === 'inr' && renderPriceInputs('prices_inr', '₹')}
                {activeTab === 'pkr' && renderPriceInputs('prices_pkr', 'Rs')}
                {activeTab === 'bdt' && renderPriceInputs('prices_bdt', '৳')}
              </div>

              <div className="space-y-2"><Label>Links</Label><Input placeholder="Download Link" value={formData.softwareDownloadLink} onChange={e => setFormData(prev => ({...prev, softwareDownloadLink: e.target.value}))}/></div>
              <div className="space-y-2"><Input placeholder="Tutorial Link" value={formData.tutorialVideoLink} onChange={e => setFormData(prev => ({...prev, tutorialVideoLink: e.target.value}))}/></div>
              <div className="space-y-2"><Textarea placeholder="Activation Process" value={formData.applyProcess} onChange={e => setFormData(prev => ({...prev, applyProcess: e.target.value}))}/></div>
              
              <div className="pt-4"><Button className="w-full" onClick={handleSubmit}>Save</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}