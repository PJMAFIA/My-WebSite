import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Wallet
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useBalanceRequestStore, formatDate } from '@/store';

export default function BalanceHistoryPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { balanceRequests, fetchUserRequests, isLoading } = useBalanceRequestStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserRequests();
  }, [isAuthenticated, navigate, fetchUserRequests]);

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="pending"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge variant="completed"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <History className="h-7 w-7 text-primary" />
              Balance History
            </h1>
            <p className="text-muted-foreground">Track your wallet top-up requests</p>
          </div>
        </div>

        <Card variant="glass">
          <CardContent className="p-0">
            {balanceRequests.length === 0 && !isLoading ? (
              <div className="text-center py-16">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No history found.</p>
                <Button variant="link" onClick={() => navigate('/add-balance')}>Add Funds</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Method</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceRequests.map((req, i) => (
                      <motion.tr 
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border/50 hover:bg-secondary/30"
                      >
                        <td className="py-4 px-6"><code className="text-xs bg-secondary/50 px-2 py-1 rounded">{req.id.slice(0, 8)}...</code></td>
                        <td className="py-4 px-6 text-sm">{formatDate(req.createdAt)}</td>
                        <td className="py-4 px-6"><Badge variant="outline">{req.paymentMethod?.replace('_', ' ').toUpperCase()}</Badge></td>
                        <td className="py-4 px-6 font-bold text-primary">${req.amount?.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right">{getStatusBadge(req.status)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}