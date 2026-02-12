import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Upload, Copy, Check, Smartphone,
  Bitcoin, ArrowLeft, Loader2, Zap, QrCode, CreditCard, Info
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 

// ✅ Updated Payment Methods List
const paymentMethods = [
  { 
    id: 'crypto_auto', 
    name: 'Crypto (Auto)', 
    icon: Zap, 
    isAuto: true 
  }, 
  { 
    id: 'upi', 
    name: 'UPI (India)', 
    icon: Smartphone, 
    details: { upiId: 'kalyanmandal.rai@oksbi', name: 'Kalyan Mandal' }, 
    qrCode: '/qr-codes/upi.jpg', 
    isAuto: false 
  },
  { 
    id: 'esewa', 
    name: 'Esewa (Nepal)', 
    icon: Wallet, 
    details: { esewaId: '9843020581', name: 'Bibek Adhikari' }, 
    qrCode: '/qr-codes/esewa.jpg', 
    isAuto: false 
  },
  { 
    id: 'easypaisa', 
    name: 'Easypaisa (PK)', 
    icon: Smartphone, 
    details: { number: '03191558149', title: 'Warda Ikhlaq' }, 
    isAuto: false 
  },
  { 
    id: 'jazzcash', 
    name: 'JazzCash (PK)', 
    icon: Smartphone, 
    details: { number: '03171396370', title: 'Hamza Akhlaq' }, 
    isAuto: false 
  },
  { 
    id: 'bkash', 
    name: 'Bkash (BD)', 
    icon: Wallet, 
    details: { number: '01700000000', title: 'My Shop' }, 
    isAuto: false 
  },
  { 
    id: 'paypal', 
    name: 'PayPal', 
    icon: CreditCard, 
    details: { email: 'Sirtajkhan7191@gmail.com', name: 'Sirtaj Khan' }, 
    isAuto: false 
  },
  { 
    id: 'binance', 
    name: 'Binance Pay', 
    icon: Bitcoin, 
    details: { payId: '586377163', email: 'akhlaq.76@gmail.com' }, 
    qrCode: '/qr-codes/binance.jpg', 
    isAuto: false 
  },
];

// ✅ Dynamic Presets based on Currency
const currencyPresets: Record<string, number[]> = {
  USD: [5, 10, 15, 30, 50, 100],
  PKR: [500, 1000, 2000, 3000, 5000, 10000],
  INR: [200, 800, 1500, 2500, 5000, 10000],
  BDT: [500, 1000, 2000, 3000, 5000, 10000],
  NPR: [500, 1000, 2000, 3000, 5000, 10000],
  GBP: [5, 10, 20, 50, 100, 200],
};

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'PKR': return 'Rs'; 
    case 'INR': return '₹'; 
    case 'GBP': return '£'; 
    case 'BDT': return '৳'; 
    case 'NPR': return 'Rs';
    default: return '$';
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
  const [showReceipt, setShowReceipt] = useState(false); // ✅ Receipt State

  // Get the correct presets for the selected currency (Default to USD if not found)
  const currentPresets = currencyPresets[currency] || currencyPresets.USD;
  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => { if (user?.currency) setCurrency(user.currency); }, [user]);
  useEffect(() => { if (!isAuthenticated) navigate('/login'); }, [isAuthenticated, navigate]);

  // 🔄 AUTO-CURRENCY LOGIC
  useEffect(() => {
    if (!paymentMethod) return;

    switch (paymentMethod) {
      case 'upi': setCurrency('INR'); break;
      case 'easypaisa':
      case 'jazzcash': setCurrency('PKR'); break;
      case 'esewa': setCurrency('NPR'); break;
      case 'bkash': setCurrency('BDT'); break;
      case 'binance':
      case 'paypal': 
      case 'crypto_auto': setCurrency('USD'); break;
      default: break;
    }
  }, [paymentMethod]);

  if (!user) return null;

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
  const isAutoPayment = selectedMethod?.isAuto;

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
        if (parseFloat(amount) < 0.1) throw new Error("Minimum for Crypto is $0.1");
        const response = await api.post('/balance/oxapay/create-payment', { amount });
        if (response.data.status === 'success' && response.data.payUrl) {
           window.location.href = response.data.payUrl;
           return;
        } else {
           throw new Error("Failed to generate payment link");
        }
      }

      // 📝 CASE 2: MANUAL UPLOAD
      if (!transactionId.trim()) throw new Error("Transaction ID missing");
      if (!screenshotFile) throw new Error("Payment screenshot is required");

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('currency', currency);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      formData.append('paymentScreenshot', screenshotFile); 

      await addBalanceRequest(formData);
      
      // 🎉 SHOW SUCCESS RECEIPT
      setShowReceipt(true);

    } catch (error: any) { 
      toast({ title: 'Error', description: error.message || 'Failed to submit.', variant: 'destructive' }); 
    } finally { 
      if (!isAutoPayment) setIsSubmitting(false); 
      else if (isAutoPayment && document.hidden) setIsSubmitting(false); 
      else setTimeout(() => setIsSubmitting(false), 5000); 
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" /> 
              Add Funds
            </h1>
            <p className="text-sm text-muted-foreground">Securely add money to your wallet.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 👈 LEFT COLUMN: Configuration */}
          <div className="lg:col-span-7 space-y-6">
            
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> 
                  1. Payment Configuration
                </CardTitle>
                <CardDescription>Select your preferred method and amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Row: Currency & Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="PKR">PKR (Rs)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                        <SelectItem value="NPR">NPR (Rs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select Method" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <method.icon className={`h-4 w-4 ${method.isAuto ? 'text-green-500' : 'text-muted-foreground'}`} />
                              <span className={method.isAuto ? 'font-medium text-green-600' : ''}>{method.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="space-y-3">
                  <Label>Select Amount</Label>
                  {/* ✅ DYNAMIC PRESETS based on selected Currency */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {currentPresets.map((preset) => (
                      <Button 
                        key={preset} 
                        type="button" 
                        variant={amount === preset.toString() ? 'default' : 'outline'} 
                        onClick={() => setAmount(preset.toString())} 
                        className="h-10 text-sm hover:border-primary/50"
                      >
                        {currencySymbol}{preset}
                      </Button>
                    ))}
                  </div>
                  <div className="relative mt-2">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</div>
                    <Input 
                      type="number" 
                      placeholder="Enter custom amount..." 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="pl-8 h-12 text-lg font-medium" 
                      min="0.1" 
                      step="0.01" 
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Amount to Add</span>
                  <span className="font-medium">{currencySymbol}{amount || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Processing Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                  <span className="font-semibold text-lg">Total Payable</span>
                  <span className="font-bold text-xl text-primary">{currencySymbol}{amount || '0.00'}</span>
                </div>
                {paymentMethod && (
                   <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                     <Info className="h-5 w-5 text-blue-500 shrink-0" />
                     <p className="text-xs text-blue-600">
                       {isAutoPayment 
                         ? "You will be redirected to a secure gateway. Funds are added instantly."
                         : "For manual payments, please allow up to 24 hours for verification."}
                     </p>
                   </div>
                )}
              </CardContent>
            </Card>

            {/* Auto Payment Action */}
            <AnimatePresence>
              {isAutoPayment && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                   <Button type="submit" variant="gradient" size="lg" className="w-full h-14 text-lg shadow-lg shadow-green-500/20" disabled={isSubmitting || !amount}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 h-5 w-5" />}
                      Pay Securely Now
                   </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* 👉 RIGHT COLUMN: Details & Action */}
          {selectedMethod && !isAutoPayment && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-6">
              
              <Card className="border-border/50 shadow-sm h-full flex flex-col border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    2. Transfer Details
                  </CardTitle>
                  <CardDescription>Scan QR or use account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  
                  {/* Payment Details Box */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
                     {/* QR Code */}
                     {selectedMethod.qrCode && (
                       <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center">
                         <img 
                           src={selectedMethod.qrCode} 
                           alt="QR Code" 
                           className="w-full max-w-[220px] object-contain"
                           onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                         />
                         <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                           <Smartphone className="h-3 w-3" /> Scan with App
                         </div>
                       </div>
                     )}

                     {/* Text Details */}
                     <div className="space-y-2">
                       {selectedMethod.details && Object.entries(selectedMethod.details).map(([key, val]) => (
                         <div key={key} className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                             <span className="font-mono text-sm font-semibold text-foreground/90">{val}</span>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleCopy(val, key)}>
                             {copied === key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                           </Button>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* Proof of Payment */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Transaction ID / Ref No <span className="text-red-500">*</span></Label>
                      <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 1234567890" className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Screenshot <span className="text-red-500">*</span></Label>
                      <div 
                        className={`group border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${!screenshotFile ? 'border-muted-foreground/20' : 'border-green-500 bg-green-500/5'}`} 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                        <div className="flex flex-col items-center gap-3">
                          {previewUrl ? (
                            <div className="relative">
                               <img src={previewUrl} className="max-h-40 rounded-lg shadow-md" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <p className="text-white text-xs font-medium">Click to Change</p>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">Click to upload proof</p>
                                <p className="text-xs text-muted-foreground">Supported: JPG, PNG, JPEG</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="gradient" 
                    size="lg" 
                    className="w-full mt-2 h-12 text-base shadow-lg shadow-primary/20" 
                    disabled={isSubmitting || !amount || !transactionId || !screenshotFile}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
                    Confirm Payment
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          )}

        </form>

        {/* 🏆 SUCCESS RECEIPT MODAL 🏆 */}
        <AnimatePresence>
          {showReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
              >
                {/* Header Pattern */}
                <div className="h-32 bg-green-500 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }} 
                     transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                     className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg z-10"
                   >
                     <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
                   </motion.div>
                </div>

                <div className="p-6 text-center space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Submitted!</h2>
                    <p className="text-gray-500 text-sm">Your request has been sent for review.</p>
                  </div>

                  {/* Receipt Details */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold text-gray-900 text-lg">{currencySymbol}{amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-gray-700 bg-gray-200 px-2 py-0.5 rounded text-xs">{transactionId}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                      <span className="text-gray-500">Method</span>
                      <span className="font-medium text-gray-900 capitalize">{selectedMethod?.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded-full text-xs">Pending Review</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
                      Go to Dashboard
                    </Button>
                    <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => navigate('/dashboard')}>
                      Track Status
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
}