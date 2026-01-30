import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Check, 
  X, 
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  useAuthStore, 
  useBalanceRequestStore,
  formatDate
} from '@/store';
import { useToast } from '@/hooks/use-toast';

export default function AdminBalancePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { balanceRequests, fetchRequests, updateBalanceRequestStatus, isLoading } = useBalanceRequestStore();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    // Fetch requests on load
    fetchRequests();
  }, [isAuthenticated, user, navigate, fetchRequests]);

  if (!user || user.role !== 'admin') return null;

  const filteredRequests = balanceRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const handleApprove = async (requestId: string) => {
    try {
      await updateBalanceRequestStatus(requestId, 'approved');
      toast({ title: 'Approved', description: 'Balance added to user account.' });
      setSelectedRequest(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve.', variant: 'destructive' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateBalanceRequestStatus(requestId, 'rejected');
      toast({ title: 'Rejected', description: 'Request rejected.' });
      setSelectedRequest(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' });
    }
  };

  const selectedRequestData = balanceRequests.find(r => r.id === selectedRequest);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="pending"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge variant="completed"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    pending: balanceRequests.filter(r => r.status === 'pending').length,
    approved: balanceRequests.filter(r => r.status === 'approved').length,
    rejected: balanceRequests.filter(r => r.status === 'rejected').length,
    totalApproved: balanceRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Balance Requests
            </h1>
            <p className="text-muted-foreground mt-1">Manage user balance top-up requests</p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" onClick={() => setFilter(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && stats.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-foreground text-primary text-xs">{stats.pending}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-500">{stats.pending}</p></div><Clock className="h-8 w-8 text-yellow-500/50" /></CardContent></Card>
          <Card variant="glass"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-500">{stats.approved}</p></div><CheckCircle className="h-8 w-8 text-green-500/50" /></CardContent></Card>
          <Card variant="glass"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-red-500">{stats.rejected}</p></div><XCircle className="h-8 w-8 text-red-500/50" /></CardContent></Card>
          <Card variant="glass"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Total Approved</p><p className="text-2xl font-bold text-primary">${stats.totalApproved.toFixed(2)}</p></div><Wallet className="h-8 w-8 text-primary/50" /></CardContent></Card>
        </div>

        {/* Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16"><Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No balance requests found.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Method</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <motion.tr key={request.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-4 px-6"><div><p className="font-medium">{request.userName}</p><p className="text-xs text-muted-foreground">{request.userEmail}</p></div></td>
                        <td className="py-4 px-6 font-bold text-primary">${request.amount.toFixed(2)}</td>
                        <td className="py-4 px-6"><Badge variant="secondary">{request.paymentMethod.replace('_', ' ').toUpperCase()}</Badge></td>
                        <td className="py-4 px-6">{getStatusBadge(request.status)}</td>
                        <td className="py-4 px-6 text-muted-foreground">{formatDate(request.createdAt)}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(request.id)}><Eye className="h-4 w-4" /></Button>
                            {request.status === 'pending' && (
                              <>
                                <Button variant="success" size="sm" onClick={() => handleApprove(request.id)} disabled={isLoading}><Check className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleReject(request.id)} disabled={isLoading}><X className="h-4 w-4" /></Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Balance Request Details</DialogTitle>
              <DialogDescription>Review transaction details.</DialogDescription>
            </DialogHeader>
            {selectedRequestData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">User</p><p className="font-medium">{selectedRequestData.userName}</p></div>
                  <div><p className="text-muted-foreground">Amount</p><p className="font-bold text-primary">${selectedRequestData.amount.toFixed(2)}</p></div>
                  <div><p className="text-muted-foreground">Method</p><p>{selectedRequestData.paymentMethod}</p></div>
                  <div><p className="text-muted-foreground">Transaction ID</p><code className="bg-secondary/50 px-2 py-1 rounded">{selectedRequestData.transactionId}</code></div>
                </div>
                {selectedRequestData.paymentScreenshot && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                    <img src={selectedRequestData.paymentScreenshot} alt="Proof" className="max-h-48 rounded-lg border border-border" />
                  </div>
                )}
                {selectedRequestData.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button variant="success" className="flex-1" onClick={() => handleApprove(selectedRequestData.id)} disabled={isLoading}>Approve</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedRequestData.id)} disabled={isLoading}>Reject</Button>
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