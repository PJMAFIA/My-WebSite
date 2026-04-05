import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2, Trash, Tag, Plus, Calendar, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({ 
    id: '', // Used for edits
    code: '', 
    type: 'percent', 
    value: '', 
    max_uses: '', 
    expires_at: '' 
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchPromos = async () => {
    try {
      const res = await api.get('/promos');
      setPromos(res.data.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  // Open Dialog for Create
  const openCreateDialog = () => {
    setIsEditing(false);
    setFormData({ id: '', code: '', type: 'percent', value: '', max_uses: '', expires_at: '' });
    setIsDialogOpen(true);
  };

  // Open Dialog for Edit
  const openEditDialog = (promo: any) => {
    setIsEditing(true);
    setFormData({
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        max_uses: promo.max_uses || '',
        expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 16) : '' // Format for datetime-local
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.value) return;
    
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null
      };

      if (isEditing) {
        // Update Existing
        await api.put(`/promos/${formData.id}`, payload);
        toast({ title: 'Promo Updated' });
      } else {
        // Create New
        await api.post('/promos', payload);
        toast({ title: 'Promo Created' });
      }

      setIsDialogOpen(false);
      fetchPromos();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this promo code?")) return;
    try {
      await api.delete(`/promos/${id}`);
      setPromos(promos.filter(p => p.id !== id));
      toast({ title: 'Promo Deleted' });
    } catch (error) { console.error(error); }
  };

  const isExpired = (dateString: string) => dateString && new Date(dateString) < new Date();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6 text-primary" /> Promo Codes</h1>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="gradient" onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> New Promo</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>{isEditing ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Promo Code</Label>
                            <Input placeholder="Code (e.g. SAVE10)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount ($)</SelectItem></SelectContent></Select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Value</Label>
                                <Input placeholder="10" type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Max Uses (Optional)</Label>
                                <Input placeholder="Unlimited" type="number" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Expiry Date (Optional)</Label>
                                <Input 
                                    type="datetime-local" 
                                    value={formData.expires_at} 
                                    onChange={e => setFormData({...formData, expires_at: e.target.value})} 
                                />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleSubmit}>{isEditing ? 'Update Code' : 'Create Code'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid gap-4">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : promos.map((p) => {
            const expired = isExpired(p.expires_at);
            return (
                <Card key={p.id} className={`p-4 flex justify-between items-center ${expired ? 'opacity-60 bg-secondary/20' : ''}`}>
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{p.code}</h3>
                        {expired && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Expired</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{p.type === 'percent' ? `${p.value}% Off` : `$${p.value} Off`}</span>
                        <span>•</span>
                        <span>{p.uses_count} used {p.max_uses ? `/ ${p.max_uses}` : ''}</span>
                        {p.expires_at && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.expires_at).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* ✅ Edit Button */}
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
                </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}