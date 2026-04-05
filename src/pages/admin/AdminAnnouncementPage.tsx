import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Save, Loader2, Link as LinkIcon, Calendar, Users, XCircle, Settings2 } from 'lucide-react';
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
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/banner', form);
      toast({ title: "Success", description: "Announcement updated!", className: "bg-emerald-500 text-white border-none" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto relative z-10 pb-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-6 bg-black/40 border border-white/[0.05] p-6 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)] shrink-0">
              <Megaphone className="h-7 w-7 text-purple-400" /> 
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Announcement Manager</h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Control the global alert banner for your users system-wide.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent pointer-events-none" />
            
            <CardHeader className="border-b border-white/[0.05] pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-purple-400" />
                  <div>
                    <CardTitle className="text-xl font-bold text-white tracking-wide">Banner Configuration</CardTitle>
                    <CardDescription className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-bold">Message, Style, and Visibility</CardDescription>
                  </div>
                </div>
                
                {/* Status Toggle */}
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors duration-300 ${form.is_active ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-white/5 border-white/10'}`}>
                   <Switch 
                      checked={form.is_active} 
                      onCheckedChange={(v) => setForm({...form, is_active: v})} 
                      id="active" 
                      className="data-[state=checked]:bg-emerald-500"
                   />
                   <Label htmlFor="active" className={`cursor-pointer font-black uppercase tracking-widest text-xs ${form.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {form.is_active ? 'Status: Live' : 'Status: Offline'}
                   </Label>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8 relative z-10">
              
              {/* Message & Type */}
              <div className="grid md:grid-cols-[1fr,250px] gap-6">
                <div className="space-y-3">
                  <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Display Message</Label>
                  <Input 
                    value={form.message} 
                    onChange={(e) => setForm({...form, message: e.target.value})} 
                    placeholder="e.g. ⚠️ Scheduled maintenance tonight at 10 PM UTC" 
                    className="h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-purple-500/30 rounded-xl" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Theme (Color)</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus:ring-purple-500/30">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1219] border-white/10 text-white backdrop-blur-xl">
                      <SelectItem value="info" className="focus:bg-blue-500/20 focus:text-blue-400">Info (Blue)</SelectItem>
                      <SelectItem value="warning" className="focus:bg-yellow-500/20 focus:text-yellow-400">Warning (Yellow)</SelectItem>
                      <SelectItem value="destructive" className="focus:bg-red-500/20 focus:text-red-400">Alert (Red + Pulse)</SelectItem>
                      <SelectItem value="success" className="focus:bg-emerald-500/20 focus:text-emerald-400">Success (Green)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Button */}
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                 <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <LinkIcon className="h-4 w-4 text-gray-500" /> Button Label (Optional)
                    </Label>
                    <Input 
                        placeholder="e.g. Upgrade Now" 
                        value={form.action_label} 
                        onChange={(e) => setForm({...form, action_label: e.target.value})} 
                        className="h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-purple-500/30 rounded-xl"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <LinkIcon className="h-4 w-4 text-gray-500" /> Button URL (Optional)
                    </Label>
                    <Input 
                        placeholder="e.g. /shop" 
                        value={form.action_url} 
                        onChange={(e) => setForm({...form, action_url: e.target.value})} 
                        className="h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-purple-500/30 rounded-xl"
                    />
                 </div>
              </div>

              {/* Targeting & Settings */}
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <Users className="h-4 w-4 text-gray-500" /> Audience Targeting
                    </Label>
                    <Select value={form.target_audience} onValueChange={(v) => setForm({...form, target_audience: v})}>
                      <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus:ring-purple-500/30">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1219] border-white/10 text-white backdrop-blur-xl">
                        <SelectItem value="all" className="focus:bg-purple-500/20">Global (Everyone)</SelectItem>
                        <SelectItem value="user" className="focus:bg-purple-500/20">Logged-in Users Only</SelectItem>
                        <SelectItem value="guest" className="focus:bg-purple-500/20">Guests Only (Logged out)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 
                 <div className="space-y-3 flex flex-col justify-end">
                    <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${form.allow_dismiss ? 'bg-purple-500/5 border-purple-500/20' : 'bg-black/50 border-white/10'}`}>
                      <Label htmlFor="dismiss" className="cursor-pointer flex items-center gap-2 text-sm text-gray-300 font-bold">
                          <XCircle className={`h-5 w-5 ${form.allow_dismiss ? 'text-purple-400' : 'text-gray-500'}`} /> Allow Users to Close/Dismiss
                      </Label>
                      <Switch 
                        checked={form.allow_dismiss} 
                        onCheckedChange={(v) => setForm({...form, allow_dismiss: v})} 
                        id="dismiss" 
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>
                 </div>
              </div>

              {/* Scheduling */}
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                 <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <Calendar className="h-4 w-4 text-gray-500" /> Auto-Start Time (Optional)
                    </Label>
                    <Input 
                        type="datetime-local" 
                        value={form.start_at} 
                        onChange={(e) => setForm({...form, start_at: e.target.value})} 
                        className="h-12 bg-black/50 border-white/10 text-gray-300 focus-visible:ring-purple-500/30 rounded-xl [color-scheme:dark]"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <Calendar className="h-4 w-4 text-gray-500" /> Auto-End Time (Optional)
                    </Label>
                    <Input 
                        type="datetime-local" 
                        value={form.end_at} 
                        onChange={(e) => setForm({...form, end_at: e.target.value})} 
                        className="h-12 bg-black/50 border-white/10 text-gray-300 focus-visible:ring-purple-500/30 rounded-xl [color-scheme:dark]"
                    />
                 </div>
              </div>

              <div className="w-full h-px bg-white/[0.05] my-2" />

              {/* Action */}
              <div className="flex justify-end pt-2">
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="h-12 px-8 text-md font-black bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-none shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-xl transition-all"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Deploy Configuration
                </Button>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}