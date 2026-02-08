import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2, Check, X, Key, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ResetRequest {
  id: string;
  username: string;
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  created_at: string;
  users: { email: string; full_name: string };
  products: { name: string };
}

export default function AdminResetsPage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/resets/admin/all');
      setRequests(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdate = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    try {
      await api.patch(`/resets/${selectedRequest.id}`, { status, adminResponse: adminNote });
      toast({ title: `Request ${status}`, description: 'User has been notified.' });
      
      // Update local state
      setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status } : r));
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" /> Credential Resets
        </h1>
        
        <div className="grid gap-4">
          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-center">No requests found.</p>
          ) : (
            requests.map((req) => (
              <Card key={req.id} variant="glass" className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'approved' ? 'completed' : 'destructive'}>
                      {req.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold">{req.products?.name || 'Unknown Product'}</h3>
                  <div className="text-sm flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {req.users?.email}</span>
                  </div>
                  
                  {/* Show credentials only to Admin */}
                  <div className="mt-2 bg-secondary/30 p-2 rounded text-sm font-mono border border-border/50">
                    <span className="text-muted-foreground">User:</span> <span className="text-foreground mr-3">{req.username}</span>
                    <span className="text-muted-foreground">Pass:</span> <span className="text-foreground">{req.password}</span>
                  </div>
                </div>
                
                {req.status === 'pending' && (
                  <Button onClick={() => setSelectedRequest(req)} size="sm">Review</Button>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Action Modal */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Request</DialogTitle>
              <DialogDescription>Approve or reject this credential reset.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <div className="bg-secondary/50 p-4 rounded text-sm space-y-1">
                 <p><strong>Product:</strong> {selectedRequest?.products?.name}</p>
                 <p><strong>User:</strong> {selectedRequest?.users?.email}</p>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Admin Note (Optional)</label>
                 <Input 
                   placeholder="e.g. Reset complete, check email" 
                   value={adminNote} 
                   onChange={(e) => setAdminNote(e.target.value)} 
                 />
               </div>
               <div className="flex gap-2 pt-2">
                 <Button className="flex-1" variant="destructive" onClick={() => handleUpdate('rejected')}>
                   <X className="mr-2 h-4 w-4"/> Reject
                 </Button>
                 <Button className="flex-1" variant="gradient" onClick={() => handleUpdate('approved')}>
                   <Check className="mr-2 h-4 w-4"/> Approve
                 </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}