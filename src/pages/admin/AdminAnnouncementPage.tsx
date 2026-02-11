import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Save, Loader2, Link as LinkIcon, Calendar, Users, XCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store';

export default function AdminAnnouncementPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    message: '',
    is_active: false,
    type: 'info',
    action_label: '',
    action_url: '',
    target_audience: 'all',
    allow_dismiss: true,
    start_at: '',
    end_at: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchSettings();
  }, [isAuthenticated, user, navigate]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/banner');
      if (data.data) {
        setForm({
          message: data.data.message || '',
          is_active: data.data.is_active || false,
          type: data.data.type || 'info',
          action_label: data.data.action_label || '',
          action_url: data.data.action_url || '',
          target_audience: data.data.target_audience || 'all',
          allow_dismiss: data.data.allow_dismiss ?? true,
          start_at: data.data.start_at ? new Date(data.data.start_at).toISOString().slice(0, 16) : '',
          end_at: data.data.end_at ? new Date(data.data.end_at).toISOString().slice(0, 16) : ''
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load settings" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/banner', form);
      toast({ title: "Success", description: "Announcement updated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Announcement Manager
          </h1>
          <p className="text-muted-foreground mt-1">Control the global alert banner for your users.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass" className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Banner Configuration</CardTitle>
                  <CardDescription>Configure message, style, and visibility.</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                   <Switch checked={form.is_active} onCheckedChange={(v) => setForm({...form, is_active: v})} id="active" />
                   <Label htmlFor="active" className="cursor-pointer font-bold">Live</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Message & Type */}
              <div className="grid md:grid-cols-[1fr,200px] gap-4">
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Input 
                    value={form.message} 
                    onChange={(e) => setForm({...form, message: e.target.value})} 
                    placeholder="e.g. ⚠️ Maintenance tonight at 10 PM" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type (Color)</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Yellow)</SelectItem>
                      <SelectItem value="destructive">Alert (Red + Pulse)</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Button */}
              <div className="grid md:grid-cols-2 gap-4 border-t border-border/50 pt-4">
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Button Label (Optional)</Label>
                    <Input placeholder="e.g. Buy Now" value={form.action_label} onChange={(e) => setForm({...form, action_label: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Button URL (Optional)</Label>
                    <Input placeholder="e.g. /shop" value={form.action_url} onChange={(e) => setForm({...form, action_url: e.target.value})} />
                 </div>
              </div>

              {/* Targeting & Settings */}
              <div className="grid md:grid-cols-3 gap-4 border-t border-border/50 pt-4">
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Audience</Label>
                    <Select value={form.target_audience} onValueChange={(v) => setForm({...form, target_audience: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="user">Logged-in Users</SelectItem>
                        <SelectItem value="guest">Guests Only</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2 flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.allow_dismiss} onCheckedChange={(v) => setForm({...form, allow_dismiss: v})} id="dismiss" />
                      <Label htmlFor="dismiss" className="cursor-pointer flex items-center gap-1"><XCircle className="h-4 w-4" /> Allow Close</Label>
                    </div>
                 </div>
              </div>

              {/* Scheduling */}
              <div className="grid md:grid-cols-2 gap-4 border-t border-border/50 pt-4">
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Start Time (Optional)</Label>
                    <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({...form, start_at: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> End Time (Optional)</Label>
                    <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({...form, end_at: e.target.value})} />
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} variant="gradient" size="lg">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}