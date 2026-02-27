import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useBalanceRequestStore, formatDate } from '@/store'; 

// ✅ Helper to get symbol (Same as Dashboard)
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

  // ✅ Helper: Formats price WITHOUT converting/multiplying
  const formatRawPrice = (amount: number, currencyCode: string) => {
    return `${getSymbol(currencyCode)}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 shadow-[0_0_10px_rgba(234,179,8,0.15)]"><Clock className="h-3 w-3 mr-1.5 animate-pulse" />Pending</Badge>;
      case 'approved': 
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]"><CheckCircle className="h-3 w-3 mr-1.5" />Approved</Badge>;
      case 'rejected': 
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.15)]"><XCircle className="h-3 w-3 mr-1.5" />Rejected</Badge>;
      default: 
        return <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header - Cyber Upgraded */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 bg-black/40 border border-white/[0.05] p-6 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/10 text-gray-400 hover:text-white shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <History className="h-5 w-5 text-cyan-400" /> 
              </div>
              Transaction Ledger
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Review your deposit history and status.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
            
            <CardContent className="p-0 relative z-10">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                      </div>
                      <p className="text-gray-400 font-medium tracking-wide">Syncing ledger...</p>
                  </motion.div>
                ) : balanceRequests.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-5 backdrop-blur-md">
                        <Wallet className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-white font-bold text-lg mb-1">No transactions found.</p>
                    <p className="text-gray-500 text-sm mb-6">Your deposit history is currently empty.</p>
                    <Button onClick={() => navigate('/add-balance')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none">
                        Initiate Deposit
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Reference ID</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Gateway</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Value</th>
                          <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceRequests.map((req, i) => (
                          <motion.tr 
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="py-4 px-6">
                                <code className="text-xs font-mono font-bold text-gray-400 bg-black/50 border border-white/5 px-2 py-1 rounded group-hover:text-cyan-400 transition-colors">
                                    {req.id.slice(0, 8)}...
                                </code>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-300 font-medium">
                                {formatDate(req.createdAt)}
                            </td>
                            <td className="py-4 px-6">
                                <Badge className="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 font-bold uppercase tracking-wider text-[10px]">
                                    {req.paymentMethod?.replace('_', ' ')}
                                </Badge>
                            </td>
                            <td className="py-4 px-6 font-black text-white text-lg drop-shadow-sm group-hover:text-cyan-400 transition-colors">
                                {formatRawPrice(req.amount, req.currency || 'USD')}
                            </td>
                            <td className="py-4 px-6 text-right">
                                {getStatusBadge(req.status)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </MainLayout>
  );
}