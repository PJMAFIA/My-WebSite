import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Check, X, Eye, Clock, CheckCircle, XCircle, Filter, Loader2, ShieldCheck
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { 
  useAuthStore, 
  useBalanceRequestStore,
  formatDate
} from '@/store';
import { useToast } from '@/hooks/use-toast';

// ✅ Exchange Rates for Admin Stats Calculation (Normalize to USD)
const exchangeRates: Record<string, number> = { 
  USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00, NPR: 133.00 
};

// ✅ Helper to get symbol
const getSymbol = (curr: string) => { 
  switch(curr) { 
    case 'GBP': return '£'; 
    case 'INR': return '₹'; 
    case 'PKR': return 'Rs. '; 
    case 'BDT': return '৳'; 
    case 'NPR': return 'Rs. '; 
    default: return '$'; 
  } 
};

export default function AdminBalancePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { balanceRequests, fetchRequests, updateBalanceRequestStatus, isLoading } = useBalanceRequestStore();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { navigate('/login'); return; }
    fetchRequests();
  }, [isAuthenticated, user, navigate, fetchRequests]);

  if (!user || user.role !== 'admin') return null;

  // ✅ NEW: Formats price WITHOUT converting (Fixes the Double Conversion Bug)
  const formatRawPrice = (amount: number, currencyCode: string) => {
    return `${getSymbol(currencyCode || 'USD')}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const filteredRequests = balanceRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const handleApprove = async (requestId: string) => {
    try { 
        await updateBalanceRequestStatus(requestId, 'approved'); 
        toast({ title: 'Success', description: 'Balance has been credited.', className: "bg-emerald-500 text-white border-none" }); 
        setSelectedRequest(null); 
    } catch (error) { 
        toast({ title: 'Error', description: 'Failed to approve.', variant: 'destructive' }); 
    }
  };

  const handleReject = async (requestId: string) => {
    try { 
        await updateBalanceRequestStatus(requestId, 'rejected'); 
        toast({ title: 'Rejected', description: 'Request has been denied.' }); 
        setSelectedRequest(null); 
    } catch (error) { 
        toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' }); 
    }
  };

  const selectedRequestData = balanceRequests.find(r => r.id === selectedRequest);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 animate-pulse">Pending</Badge>;
      case 'approved': 
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5">Approved</Badge>;
      case 'rejected': 
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5">Rejected</Badge>;
      default: 
        return <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</Badge>;
    }
  };

  // ✅ Fixed Stats Calculation
  const stats = {
    pending: balanceRequests.filter(r => r.status === 'pending').length,
    approved: balanceRequests.filter(r => r.status === 'approved').length,
    rejected: balanceRequests.filter(r => r.status === 'rejected').length,
    totalApprovedUSD: balanceRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => {
        const rate = exchangeRates[r.currency || 'USD'] || 1;
        return sum + (r.amount / rate); // Convert to USD before summing
      }, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10 pb-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-black/40 border border-white/[0.05] p-6 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)] shrink-0">
                <Wallet className="h-7 w-7 text-cyan-400" /> 
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Deposit Management</h1>
                <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">Validate and process user balance requests</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-gray-500 mr-2 border-r border-white/10 uppercase tracking-widest">
                <Filter className="h-3.5 w-3.5" /> Filter
            </div>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button 
                key={status} 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilter(status)}
                className={`text-xs font-black uppercase tracking-tight h-8 px-4 rounded-lg transition-all ${
                    filter === status 
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:bg-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
                {status === 'pending' && stats.pending > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-black/40 text-cyan-400 border border-cyan-400/30 text-[10px] animate-pulse">
                        {stats.pending}
                    </span>
                )}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <AdminStatCard label="Pending" value={stats.pending} color="text-yellow-400" bg="bg-yellow-400/10" icon={Clock} />
          <AdminStatCard label="Approved" value={stats.approved} color="text-emerald-400" bg="bg-emerald-400/10" icon={CheckCircle} />
          <AdminStatCard label="Rejected" value={stats.rejected} color="text-red-400" bg="bg-red-400/10" icon={XCircle} />
          <AdminStatCard label="Volume (USD)" value={`$${stats.totalApprovedUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-cyan-400" bg="bg-cyan-400/10" icon={ShieldCheck} />
        </div>

        {/* Table Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
            
            <CardContent className="p-0 relative z-10">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-24">
                    <Wallet className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Clear - No requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Subscriber</th>
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Transaction Value</th>
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Gateway</th>
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Received</th>
                          <th className="py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Intel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request, i) => (
                          <motion.tr 
                            key={request.id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-4 px-6">
                                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{request.userName}</div>
                                <div className="text-[10px] text-gray-500 font-medium lowercase tracking-tight">{request.userEmail}</div>
                            </td>
                            <td className="py-4 px-6">
                                <span className="font-black text-white tracking-tight text-lg">
                                    {formatRawPrice(request.amount, request.currency || 'USD')}
                                </span>
                            </td>
                            <td className="py-4 px-6">
                                <Badge className="bg-white/5 text-gray-400 border-white/10 uppercase font-black text-[9px] tracking-widest group-hover:border-cyan-500/30 transition-colors">
                                    {request.paymentMethod.replace('_', ' ')}
                                </Badge>
                            </td>
                            <td className="py-4 px-6 text-center">{getStatusBadge(request.status)}</td>
                            <td className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                {formatDate(request.createdAt)}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-lg transition-all" 
                                    onClick={() => setSelectedRequest(request.id)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button 
                                        className="h-9 w-9 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                                        size="icon" 
                                        onClick={() => handleApprove(request.id)} 
                                        disabled={isLoading}
                                    >
                                        <Check className="h-4 w-4" strokeWidth={3} />
                                    </Button>
                                    <Button 
                                        className="h-9 w-9 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/30 rounded-lg transition-all" 
                                        size="icon" 
                                        onClick={() => handleReject(request.id)} 
                                        disabled={isLoading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
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
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-xl bg-[#0a0d14] border border-white/10 text-white backdrop-blur-2xl">
            <DialogHeader className="border-b border-white/5 pb-4">
                <DialogTitle className="text-xl font-black flex items-center gap-2 tracking-tight">
                    <ShieldCheck className="h-5 w-5 text-cyan-400" /> Transaction Intel
                </DialogTitle>
                <DialogDescription className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Full verification breakdown</DialogDescription>
            </DialogHeader>
            
            {selectedRequestData && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subscriber Identity</p>
                      <p className="font-bold text-white text-sm">{selectedRequestData.userName}</p>
                      <p className="text-xs text-gray-400">{selectedRequestData.userEmail}</p>
                  </div>
                  
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verified Amount</p>
                      <p className="font-black text-cyan-400 text-xl tracking-tight">
                          {formatRawPrice(selectedRequestData.amount, selectedRequestData.currency || 'USD')}
                      </p>
                  </div>
                  
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gateway Provider</p>
                      <Badge className="bg-white/5 text-gray-300 border-white/10 uppercase text-[9px] mt-1">{selectedRequestData.paymentMethod}</Badge>
                  </div>
                  
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network Reference</p>
                      <code className="bg-black border border-white/10 px-2 py-1 rounded text-xs font-mono text-cyan-400 inline-block mt-1">
                          {selectedRequestData.transactionId}
                      </code>
                  </div>
                </div>

                {selectedRequestData.paymentScreenshot && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Evidence of Transfer</p>
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black group">
                        <img src={selectedRequestData.paymentScreenshot} alt="Proof" className="w-full h-auto max-h-[300px] object-contain" />
                        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </div>
                )}

                {selectedRequestData.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <Button 
                        className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all" 
                        onClick={() => handleApprove(selectedRequestData.id)} 
                        disabled={isLoading}
                    >
                        Validate & Credit
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex-1 h-12 border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs transition-all" 
                        onClick={() => handleReject(selectedRequestData.id)} 
                        disabled={isLoading}
                    >
                        Reject Entry
                    </Button>
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

function AdminStatCard({ label, value, color, bg, icon: Icon }: any) {
    return (
        <Card className="bg-black/40 border border-white/[0.05] shadow-xl backdrop-blur-xl group overflow-hidden relative">
            <CardContent className="p-6 flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${bg} border border-white/5 flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            </CardContent>
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} blur-[40px] opacity-20 group-hover:opacity-50 transition-opacity duration-500`} />
        </Card>
    );
}