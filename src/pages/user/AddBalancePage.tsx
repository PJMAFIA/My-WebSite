import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, Upload, Copy, Check, CreditCard, Smartphone,
  Building2, Bitcoin, ArrowLeft, Loader2, Globe, Zap // ✅ Added Zap icon
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; // ✅ Needed for direct API call

// ✅ Updated Payment Methods List
const paymentMethods = [
  { id: 'crypto_auto', name: 'Crypto (Auto)', icon: Zap, isAuto: true }, // 🚀 NEW
  { id: 'upi', name: 'UPI', icon: Smartphone, details: { upiId: 'business@paytm' }, isAuto: false },
  { id: 'crypto_manual', name: 'Crypto (Manual)', icon: Bitcoin, details: { walletAddress: '0x1234...5678', network: 'ETH/BNB/USDT' }, isAuto: false },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, details: { accountName: 'SaaSify Inc.', accountNumber: '1234567890', ifsc: 'HDFC0001234', bankName: 'HDFC Bank' }, isAuto: false },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, details: { email: 'payments@saasify.com' }, isAuto: false },
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
  const [currency, setCurrency] = useState<string>('USD'); 
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
  const isAutoPayment = selectedMethod?.isAuto; // ✅ Check if Auto
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

    setIsSubmitting(true);
    
    try {
      // 🚀 CASE 1: AUTOMATED CRYPTO PAYMENT
      if (isAutoPayment) {
        // Validation: Crypto usually needs at least $2
        if (parseFloat(amount) < 2) throw new Error("Minimum for Crypto is $2");

        const response = await api.post('/balance/oxapay/create-payment', { amount });
        
        if (response.data.status === 'success' && response.data.payUrl) {
           // Redirect user to Oxapay Payment Page
           window.location.href = response.data.payUrl;
           return;
        } else {
           throw new Error("Failed to generate payment link");
        }
      }

      // 📝 CASE 2: MANUAL UPLOAD (Existing Logic)
      if (!transactionId.trim()) throw new Error("Transaction ID missing");

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('currency', currency);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      if (screenshotFile) formData.append('paymentScreenshot', screenshotFile);

      await addBalanceRequest(formData);
      toast({ title: 'Payment Submitted', description: 'Under review.' });
      navigate('/dashboard');

    } catch (error: any) { 
      toast({ title: 'Error', description: error.message || 'Failed to submit.', variant: 'destructive' }); 
    } finally { 
      // Only stop loading if we didn't redirect (Manual Mode or Error)
      if (!isAutoPayment) setIsSubmitting(false); 
      else if (isAutoPayment && document.hidden) setIsSubmitting(false); // Failsafe
      else setTimeout(() => setIsSubmitting(false), 5000); // Reset after delay if redirect fails
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-2xl font-bold flex items-center gap-3"><Wallet className="h-7 w-7 text-primary" />Add Balance</h1><p className="text-muted-foreground">Add funds to your wallet</p></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ Currency Selector (Kept as requested) */}
          <Card variant="glass">
            <CardContent className="pt-6">
              <Label>Select Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12 mt-2"><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="PKR">PKR (Rs)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="BDT">BDT (৳)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <Card variant="glass">
            <CardHeader><CardTitle className="text-lg">Select Amount</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((preset) => (
                  <Button key={preset} type="button" variant={amount === preset.toString() ? 'default' : 'outline'} onClick={() => setAmount(preset.toString())} className="h-12">
                    {currencySymbol}{preset}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
                <Input type="number" placeholder="Custom amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10 text-lg h-12" min="1" step="0.01" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selector */}
          <Card variant="glass">
            <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {/* Highlight Auto method */}
                        <method.icon className={`h-4 w-4 ${method.isAuto ? 'text-green-500' : ''}`} />
                        <span className={method.isAuto ? 'font-bold text-green-500' : ''}>{method.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Show Manual Details ONLY if NOT auto */}
              {selectedMethod && !isAutoPayment && selectedMethod.details && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-secondary/50 space-y-3">
                   <p className="text-sm font-medium text-primary mb-3">Bank/Wallet Details</p>
                   {Object.entries(selectedMethod.details).map(([key, val]) => (
                     <div key={key} className="flex justify-between items-center">
                       <div>
                         <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                         <p className="font-mono text-sm">{val}</p>
                       </div>
                       <Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(val, key)}>
                         {copied === key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                       </Button>
                     </div>
                   ))}
                </motion.div>
              )}

              {/* Show Auto Message */}
              {isAutoPayment && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 space-y-2">
                  <p className="font-medium flex items-center gap-2"><Zap className="h-4 w-4" /> Instant Credit</p>
                  <p className="text-sm">You will be redirected to a secure payment gateway. Balance is added automatically after confirmation.</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Screenshot & ID (Manual Only - Hidden for Auto) */}
          {!isAutoPayment && (
            <Card variant="glass">
              <CardHeader><CardTitle className="text-lg">Proof of Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction ID</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter ID" />
                </div>
                <div className="space-y-2">
                  <Label>Screenshot</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                    {previewUrl ? <img src={previewUrl} className="max-h-32 mx-auto rounded-lg" /> : <div className="space-y-2"><Upload className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">Upload screenshot</p></div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting || !amount || !paymentMethod || (!isAutoPayment && !transactionId)}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Wallet className="mr-2 h-4 w-4"/> {isAutoPayment ? 'Proceed to Payment' : 'Submit Request'}</>}
          </Button>

        </form>
      </div>
    </MainLayout>
  );
}