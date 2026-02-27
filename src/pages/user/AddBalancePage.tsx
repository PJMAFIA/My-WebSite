import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Upload, Copy, Check, Smartphone,
  Bitcoin, ArrowLeft, Loader2, Zap, QrCode, CreditCard, Info, AlertCircle, ShieldCheck
} from 'lucide-react';
import imageCompression from 'browser-image-compression'; 
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 

// ✅ Updated Payment Methods List
const paymentMethods = [
  { id: 'crypto_auto', name: 'Crypto (Auto)', icon: Zap, isAuto: true }, 
  { id: 'upi', name: 'UPI (India)', icon: Smartphone, details: { upiId: 'kalyanmandal.rai@oksbi', name: 'Kalyan Mandal' }, qrCode: '/qr-codes/upi.jpg', isAuto: false },
  { id: 'esewa', name: 'Esewa (Nepal)', icon: Wallet, details: { esewaId: '9843020581', name: 'Bibek Adhikari' }, qrCode: '/qr-codes/esewa.jpg', isAuto: false },
  { id: 'easypaisa', name: 'Easypaisa (PK)', icon: Smartphone, details: { number: '03191558149', title: 'Warda Ikhlaq' }, isAuto: false },
  { id: 'jazzcash', name: 'JazzCash (PK)', icon: Smartphone, details: { number: '03171396370', title: 'Hamza Akhlaq' }, isAuto: false },
  { id: 'bkash', name: 'Bkash (BD)', icon: Wallet, details: { number: '01700000000', title: 'My Shop' }, isAuto: false },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, details: { email: 'Sirtajkhan7191@gmail.com', name: 'Sirtaj Khan' }, isAuto: false },
  { id: 'binance', name: 'Binance Pay', icon: Bitcoin, details: { payId: '586377163', email: 'akhlaq.76@gmail.com' }, qrCode: '/qr-codes/binance.jpg', isAuto: false },
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
  const { user, isAuthenticated, currentCurrency, setCurrency: setGlobalCurrency } = useAuthStore();
  const { addBalanceRequest } = useBalanceRequestStore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>('');
  
  // Local state for view (syncs with global)
  const [currency, setCurrency] = useState<string>(currentCurrency || 'USD'); 

  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string>('');
  
  // ✅ Receipt UI State
  const [showReceipt, setShowReceipt] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'processing' | 'success' | 'error'>('processing');

  const currentPresets = currencyPresets[currency] || currencyPresets.USD;
  const currencySymbol = getCurrencySymbol(currency);

  // Sync with Global
  useEffect(() => { if (currentCurrency) setCurrency(currentCurrency); }, [currentCurrency]);
  useEffect(() => { if (!isAuthenticated) navigate('/login'); }, [isAuthenticated, navigate]);

  // 🔄 Auto-Switch Display Currency based on Payment Method
  useEffect(() => {
    if (!paymentMethod) return;
    let newCurr = 'USD';
    switch (paymentMethod) {
      case 'upi': newCurr = 'INR'; break;
      case 'easypaisa': case 'jazzcash': newCurr = 'PKR'; break;
      case 'esewa': newCurr = 'NPR'; break;
      case 'bkash': newCurr = 'BDT'; break;
      case 'binance': case 'paypal': case 'crypto_auto': newCurr = 'USD'; break;
      default: break;
    }
    setCurrency(newCurr);
    setGlobalCurrency(newCurr as any);
  }, [paymentMethod, setGlobalCurrency]);

  if (!user) return null;

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
  const isAutoPayment = selectedMethod?.isAuto;

  const handleCopy = (text: string, label: string) => { 
    navigator.clipboard.writeText(text); 
    setCopied(label); 
    setTimeout(() => setCopied(''), 2000); 
    toast({ description: "Copied to clipboard", className: "bg-emerald-500 text-white border-none" });
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
      // Basic validation
      if (!file.type.startsWith('image/')) {
        return toast({ title: "Invalid File", description: "Please upload an image (JPG, PNG).", variant: "destructive" });
      }
      setScreenshotFile(file); 
      const reader = new FileReader(); 
      reader.onloadend = () => setPreviewUrl(reader.result as string); 
      reader.readAsDataURL(file); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast({ title: 'Invalid Amount', variant: 'destructive' });
    if (!paymentMethod) return toast({ title: 'Missing Method', variant: 'destructive' });

    setIsSubmitting(true);
    
    try {
      // 🚀 CASE 1: AUTOMATED CRYPTO
      if (isAutoPayment) {
        const response = await api.post('/crypto/create-invoice', { 
            amount: parseFloat(amount),
            currency: 'USD' 
        });
        
        if (response.data?.paymentUrl) {
            window.location.href = response.data.paymentUrl;
        } else {
            throw new Error("Failed to generate payment link");
        }
        return; 
      }

      // 📝 CASE 2: MANUAL UPLOAD - ⚡ MOBILE FIX
      if (!transactionId.trim()) throw new Error("Transaction ID missing");
      if (!screenshotFile) throw new Error("Payment screenshot is required");

      // 🛑 FORCE CORRECT CURRENCY FOR SUBMISSION
      let submitCurrency = 'USD';
      switch (paymentMethod) {
        case 'upi': submitCurrency = 'INR'; break;
        case 'esewa': submitCurrency = 'NPR'; break;
        case 'easypaisa':
        case 'jazzcash': submitCurrency = 'PKR'; break;
        case 'bkash': submitCurrency = 'BDT'; break;
        default: submitCurrency = 'USD'; break;
      }

      // ✅ 1. SHOW PROCESSING UI INSTANTLY
      setShowReceipt(true);
      setSubmissionStatus('processing');

      // ✅ 2. BACKGROUND COMPRESSION & UPLOAD
      // This prevents the UI from freezing on mobile while compressing 5MB+ images
      setTimeout(async () => {
        try {
          // Compression Settings
          const options = { 
            maxSizeMB: 0.3,          // Compress to ~300KB
            maxWidthOrHeight: 1000,  // Resize to max 1000px
            useWebWorker: true,      // Run in background thread
            fileType: 'image/jpeg'   // Force JPEG for better compatibility
          };

          let fileToSend = screenshotFile;
          
          // Only compress if it's an image
          if (screenshotFile.type.startsWith('image/')) {
             try {
                 console.log(`Original size: ${screenshotFile.size / 1024 / 1024} MB`);
                 fileToSend = await imageCompression(screenshotFile, options);
                 console.log(`Compressed size: ${fileToSend.size / 1024 / 1024} MB`);
             } catch (compError) {
                 console.warn("Compression failed, sending original:", compError);
             }
          }

          const formData = new FormData();
          formData.append('amount', amount);
          formData.append('currency', submitCurrency); 
          formData.append('paymentMethod', paymentMethod);
          formData.append('transactionId', transactionId.trim());
          formData.append('paymentScreenshot', fileToSend); 

          await addBalanceRequest(formData);
          
          setSubmissionStatus('success');
        } catch (bgError: any) {
          console.error("Background upload failed:", bgError);
          setSubmissionStatus('error');
          setShowReceipt(false); // Close receipt to show error
          toast({ 
            title: 'Upload Failed', 
            description: bgError.response?.data?.message || 'Server rejected the file. Try a smaller image.', 
            variant: 'destructive' 
          });
        }
      }, 100); // Small delay to allow UI to render 'processing' state

    } catch (error: any) { 
      setIsSubmitting(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' }); 
    } finally { 
       if (!isAutoPayment) {
         // We keep isSubmitting true if we showed the receipt, otherwise false
         if (!showReceipt) setIsSubmitting(false);
       }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 relative z-10">
        
        {/* Header - Cyber Upgraded */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 bg-black/40 border border-white/[0.05] p-6 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-white/10 text-gray-400 hover:text-white shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <Wallet className="h-5 w-5 text-cyan-400" /> 
              </div>
              Add Funds
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Securely inject capital into your wallet.</p>
          </div>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 👈 LEFT COLUMN: Configuration */}
          <div className="lg:col-span-7 space-y-6">
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-black/40 border-white/[0.05] shadow-xl backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none" />
                <div className="p-6 border-b border-white/[0.05] flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-cyan-400" /> 
                    <h2 className="text-lg font-bold text-white tracking-wide">1. Payment Configuration</h2>
                </div>
                <CardContent className="p-6 space-y-8 relative z-10">
                    
                    {/* Row: Currency & Method */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-gray-400 font-bold tracking-wider text-xs uppercase">Currency</Label>
                        <Select value={currency} onValueChange={(val) => { setCurrency(val); setGlobalCurrency(val as any); }}>
                        <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white hover:border-cyan-500/50 transition-colors rounded-xl font-medium focus:ring-cyan-500/30">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1219] border-white/10 text-white backdrop-blur-xl">
                            <SelectItem value="USD" className="focus:bg-cyan-500/20 focus:text-cyan-400">USD ($)</SelectItem>
                            <SelectItem value="INR" className="focus:bg-cyan-500/20 focus:text-cyan-400">INR (₹)</SelectItem>
                            <SelectItem value="PKR" className="focus:bg-cyan-500/20 focus:text-cyan-400">PKR (Rs)</SelectItem>
                            <SelectItem value="GBP" className="focus:bg-cyan-500/20 focus:text-cyan-400">GBP (£)</SelectItem>
                            <SelectItem value="BDT" className="focus:bg-cyan-500/20 focus:text-cyan-400">BDT (৳)</SelectItem>
                            <SelectItem value="NPR" className="focus:bg-cyan-500/20 focus:text-cyan-400">NPR (Rs)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-400 font-bold tracking-wider text-xs uppercase">Payment Gateway</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white hover:border-cyan-500/50 transition-colors rounded-xl font-medium focus:ring-cyan-500/30">
                            <SelectValue placeholder="Select Method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1219] border-white/10 text-white backdrop-blur-xl">
                            {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id} className="focus:bg-cyan-500/10">
                                <div className="flex items-center gap-3">
                                <method.icon className={`h-4 w-4 ${method.isAuto ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-cyan-400'}`} />
                                <span className={method.isAuto ? 'font-bold text-emerald-400' : 'font-medium'}>{method.name}</span>
                                </div>
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    </div>

                    {/* Amount Section */}
                    <div className="space-y-4">
                    <Label className="text-gray-400 font-bold tracking-wider text-xs uppercase flex items-center justify-between">
                        <span>Deposit Amount</span>
                        {amount && <span className="text-cyan-400">Selected: {currencySymbol}{amount}</span>}
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {currentPresets.map((preset) => (
                        <button 
                            key={preset} 
                            type="button" 
                            onClick={() => setAmount(preset.toString())} 
                            className={`h-11 rounded-lg text-sm font-bold transition-all duration-200 border ${
                                amount === preset.toString() 
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                                : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-cyan-500/30 hover:text-white'
                            }`}
                        >
                            {currencySymbol}{preset}
                        </button>
                        ))}
                    </div>
                    <div className="relative mt-2">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-black text-lg">{currencySymbol}</div>
                        <Input 
                        type="number" 
                        placeholder="Enter custom amount..." 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="pl-10 h-14 text-lg font-bold bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 rounded-xl" 
                        min="0.1" 
                        step="0.01" 
                        />
                    </div>
                    </div>

                </CardContent>
                </Card>
            </motion.div>

            {/* Summary Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-white/[0.02] to-transparent border-white/[0.05] backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3 text-gray-400 font-medium">
                        <span>Amount to Inject</span>
                        <span className="text-white">{currencySymbol}{amount || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between mb-5 text-gray-400 font-medium">
                        <span>Network Fee</span>
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs font-bold">0.00%</span>
                    </div>
                    <div className="border-t border-white/10 pt-5 flex items-center justify-between">
                        <span className="font-bold text-lg text-white">Total Payable</span>
                        <span className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-sm">{currencySymbol}{amount || '0.00'}</span>
                    </div>
                    {paymentMethod && (
                        <div className={`mt-6 p-4 rounded-xl border flex gap-4 items-start ${isAutoPayment ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                        {isAutoPayment ? <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" /> : <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />}
                        <p className={`text-sm font-medium leading-relaxed ${isAutoPayment ? 'text-emerald-400' : 'text-cyan-400'}`}>
                            {isAutoPayment 
                            ? "Automated Gateway: You will be redirected. Funds are added instantly upon block confirmation."
                            : "Manual Verification: Please complete the transfer using the details provided, then upload your receipt below."}
                        </p>
                        </div>
                    )}
                </CardContent>
                </Card>
            </motion.div>

            {/* Auto Payment Action */}
            <AnimatePresence>
              {isAutoPayment && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                   <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black tracking-wide bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] border-none mt-4 rounded-xl transition-all" 
                    disabled={isSubmitting || !amount}
                   >
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 h-5 w-5" />}
                      Execute Secure Payment
                   </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* 👉 RIGHT COLUMN: Details & Action */}
          <AnimatePresence>
          {selectedMethod && !isAutoPayment && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-5 space-y-6">
              
              <Card className="bg-black/40 border-white/[0.05] shadow-xl backdrop-blur-xl h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
                
                <div className="p-6 border-b border-white/[0.05] flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-cyan-400" />
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-wide leading-tight">2. Transfer Details</h2>
                        <p className="text-xs text-gray-500 font-medium">Scan QR or copy credentials</p>
                    </div>
                </div>
                
                <CardContent className="space-y-6 flex-1 p-6">
                  
                  {/* Payment Details Box */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-5">
                      {/* QR Code */}
                      {selectedMethod.qrCode && (
                        <div className="bg-white p-4 rounded-xl border-4 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex flex-col items-center mx-auto w-fit">
                          <img 
                            src={selectedMethod.qrCode} 
                            alt="QR Code" 
                            className="w-full max-w-[180px] object-contain rounded-md"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
                            <Smartphone className="h-3.5 w-3.5" /> Scan to Pay
                          </div>
                        </div>
                      )}

                      {/* Text Details */}
                      <div className="space-y-3">
                        {selectedMethod.details && Object.entries(selectedMethod.details).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between bg-black/60 p-3.5 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-colors group">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] uppercase text-cyan-400 font-black tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-mono text-sm font-bold text-white truncate">{val}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-gray-400 rounded-lg ml-2 shrink-0 transition-all" onClick={() => handleCopy(val, key)}>
                              {copied === key ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                  {/* Proof of Payment */}
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <Label className="text-gray-300 font-bold text-xs uppercase tracking-wider">Transaction ID / Ref No <span className="text-red-500">*</span></Label>
                      <Input 
                        value={transactionId} 
                        onChange={(e) => setTransactionId(e.target.value)} 
                        placeholder="Paste exactly as shown on your receipt..." 
                        className="h-12 bg-black/50 border-white/10 focus-visible:ring-cyan-500/30 text-white font-mono rounded-xl placeholder:font-sans placeholder:text-gray-600" 
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-300 font-bold text-xs uppercase tracking-wider flex justify-between">
                          <span>Upload Receipt <span className="text-red-500">*</span></span>
                          <span className="text-gray-500">JPG/PNG</span>
                      </Label>
                      <div 
                        className={`group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden ${!screenshotFile ? 'border-white/10 hover:border-cyan-500/50 bg-black/40 hover:bg-cyan-500/5' : 'border-emerald-500/50 bg-emerald-500/10'}`} 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                        
                        <div className="relative z-10 flex flex-col items-center gap-3">
                          {previewUrl ? (
                            <div className="relative w-full flex justify-center">
                               <img src={previewUrl} className="max-h-48 rounded-lg shadow-2xl object-contain border border-white/10" />
                               <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                                  <p className="text-white text-sm font-bold flex items-center gap-2"><Upload className="h-4 w-4"/> Click to Replace</p>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all shadow-lg">
                                <Upload className="h-6 w-6 text-gray-400 group-hover:text-cyan-400" />
                              </div>
                              <div className="space-y-1 mt-2">
                                <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Select Receipt Image</p>
                                <p className="text-xs text-gray-500 font-medium">Clear screenshots speed up approval</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-4 h-14 text-base font-black tracking-wide bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border-none rounded-xl transition-all disabled:opacity-50 disabled:shadow-none" 
                    disabled={isSubmitting || !amount || !transactionId || !screenshotFile}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
                    Confirm Deposit Request
                  </Button>

                </CardContent>
              </Card>
            </motion.div>
          )}
          </AnimatePresence>
        </form>

        {/* 🏆 INSTANT SUCCESS RECEIPT MODAL 🏆 */}
        <AnimatePresence>
          {showReceipt && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0a0d14] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-white/10"
              >
                {/* Header Pattern with Dynamic Status */}
                <div className={`h-36 flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${submissionStatus === 'success' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'}`}>
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
                   
                   <motion.div 
                     initial={{ scale: 0, rotate: -180 }} 
                     animate={{ scale: 1, rotate: 0 }} 
                     transition={{ type: "spring", damping: 15 }}
                     className={`h-24 w-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 border-4 ${submissionStatus === 'success' ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-black border-cyan-500 text-cyan-400'}`}
                   >
                     {submissionStatus === 'processing' ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                     ) : (
                        <Check className="h-12 w-12" strokeWidth={3} />
                     )}
                   </motion.div>
                </div>

                <div className="p-8 text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {submissionStatus === 'processing' ? 'Encrypting Request...' : 'Deposit Submitted!'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-2 font-medium">
                        {submissionStatus === 'processing' ? 'Securely uploading your receipt to our servers.' : 'Your request is now pending admin verification.'}
                    </p>
                  </div>

                  {/* Receipt Details (Only show when success) */}
                  <AnimatePresence>
                    {submissionStatus === 'success' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-black/50 rounded-xl p-5 border border-white/[0.05] space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Amount</span>
                                <span className="font-black text-white text-lg">{currencySymbol}{amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Ref ID</span>
                                <span className="font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded text-xs">{transactionId}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Method</span>
                                <span className="font-bold text-white capitalize">{selectedMethod?.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Status</span>
                                <span className="text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-0.5 rounded-md text-xs animate-pulse">Pending Review</span>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 pt-2">
                    <Button variant="outline" className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-white h-12 rounded-xl font-bold" onClick={() => navigate('/dashboard')} disabled={submissionStatus === 'processing'}>
                      Dashboard
                    </Button>
                    <Button variant="default" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black h-12 rounded-xl font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" onClick={() => navigate('/dashboard')} disabled={submissionStatus === 'processing'}>
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