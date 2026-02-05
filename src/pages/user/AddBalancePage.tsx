import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, Upload, Copy, Check, CreditCard, Smartphone,
  Building2, Bitcoin, ArrowLeft, Loader2, Globe 
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { useToast } from '@/hooks/use-toast';

const paymentMethods = [
  { id: 'upi', name: 'UPI', icon: Smartphone, details: { upiId: 'business@paytm' } },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, details: { walletAddress: '0x1234...5678', network: 'ETH/BNB/USDT' } },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, details: { accountName: 'SaaSify Inc.', accountNumber: '1234567890', ifsc: 'HDFC0001234', bankName: 'HDFC Bank' } },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, details: { email: 'payments@saasify.com' } },
];

const presetAmounts = [10, 25, 50, 100, 250, 500];

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'PKR': return 'Rs'; case 'INR': return '₹'; case 'GBP': return '£'; case 'BDT': return '৳'; default: return '$';
  }
};

export default function AddBalancePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addBalanceRequest } = useBalanceRequestStore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD'); // ✅ Default
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string>('');

  useEffect(() => { if (user?.currency) setCurrency(user.currency); }, [user]);
  useEffect(() => { if (!isAuthenticated) navigate('/login'); }, [isAuthenticated, navigate]);

  if (!user) return null;

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
  const currencySymbol = getCurrencySymbol(currency);

  const handleCopy = (text: string, label: string) => { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setScreenshotFile(file); const reader = new FileReader(); reader.onloadend = () => setPreviewUrl(reader.result as string); reader.readAsDataURL(file); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast({ title: 'Invalid Amount', variant: 'destructive' });
    if (!paymentMethod) return toast({ title: 'Missing Method', variant: 'destructive' });
    if (!transactionId.trim()) return toast({ title: 'Missing Info', variant: 'destructive' });

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('currency', currency); // ✅ Sending Currency
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      if (screenshotFile) formData.append('paymentScreenshot', screenshotFile);

      await addBalanceRequest(formData);
      toast({ title: 'Payment Submitted', description: 'Under review.' });
      navigate('/dashboard');
    } catch (error: any) { toast({ title: 'Error', description: 'Failed to submit.', variant: 'destructive' }); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button><div><h1 className="text-2xl font-bold flex items-center gap-3"><Wallet className="h-7 w-7 text-primary" />Add Balance</h1><p className="text-muted-foreground">Add funds to your wallet</p></div></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ Currency Selector */}
          <Card variant="glass"><CardContent className="pt-6"><Label>Select Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="h-12 mt-2"><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="PKR">PKR (Rs)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem><SelectItem value="BDT">BDT (৳)</SelectItem></SelectContent></Select></CardContent></Card>

          {/* Amount */}
          <Card variant="glass"><CardHeader><CardTitle className="text-lg">Select Amount</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-3">{presetAmounts.map((preset) => (<Button key={preset} type="button" variant={amount === preset.toString() ? 'default' : 'outline'} onClick={() => setAmount(preset.toString())} className="h-12">{currencySymbol}{preset}</Button>))}</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span><Input type="number" placeholder="Custom amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10 text-lg h-12" min="1" step="0.01" /></div></CardContent></Card>

          {/* Payment Method */}
          <Card variant="glass"><CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader><CardContent className="space-y-4"><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger className="h-12"><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent>{paymentMethods.map((method) => (<SelectItem key={method.id} value={method.id}><div className="flex items-center gap-2"><method.icon className="h-4 w-4" />{method.name}</div></SelectItem>))}</SelectContent></Select>
            {selectedMethod && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-secondary/50 space-y-3"><p className="text-sm font-medium text-primary mb-3">Details</p>
                {paymentMethod === 'upi' && <div className="flex justify-between"><div><p className="text-xs text-muted-foreground">UPI ID</p><p className="font-mono">{selectedMethod.details.upiId}</p></div><Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.upiId!, 'upi')}>{copied === 'upi' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button></div>}
                {paymentMethod === 'crypto' && <div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Wallet</p><p className="font-mono text-sm">{selectedMethod.details.walletAddress}</p></div><Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.walletAddress!, 'wallet')}>{copied === 'wallet' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button></div>}
                {/* Add other methods similarly if needed */}
            </motion.div>)}
          </CardContent></Card>

          {/* Transaction ID */}
          <Card variant="glass"><CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Transaction ID</Label><Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter ID" /></div><div className="space-y-2"><Label>Screenshot</Label><div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}><input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />{previewUrl ? <img src={previewUrl} className="max-h-32 mx-auto rounded-lg" /> : <div className="space-y-2"><Upload className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">Upload screenshot</p></div>}</div></div></CardContent></Card>

          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting || !amount || !paymentMethod || !transactionId}>{isSubmitting ? <Loader2 className="animate-spin" /> : <><Wallet className="mr-2 h-4 w-4"/> Submit</>}</Button>
        </form>
      </div>
    </MainLayout>
  );
}