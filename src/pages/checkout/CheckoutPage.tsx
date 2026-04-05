import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, Upload, CheckCircle, ArrowLeft, Copy, Wallet, QrCode, Loader2, Zap, Tag, ShieldCheck, Plus, Minus, Gift, Smartphone, Bitcoin, Check
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartStore, useAuthStore, formatPlan } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api'; 
import { Badge } from '@/components/ui/badge';

// ✅ Real Payment Methods Integrated
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

const exchangeRates: Record<string, number> = {
  USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00, NPR: 133.00
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { selectedProduct, selectedPlan, quantity, setQuantity, clearCart } = useCartStore();
  
  const { user, isAuthenticated, login, token, currentCurrency } = useAuthStore() as any;
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (!selectedProduct || !selectedPlan) navigate('/shop');
  }, [isAuthenticated, selectedProduct, selectedPlan, navigate]);

  if (!selectedProduct || !selectedPlan || !user) return null;

  const currency = currentCurrency || user?.currency || 'USD';
  const exchangeRate = exchangeRates[currency] || 1;

  const localizedBalance = (user.balance || 0) * exchangeRate;

  const getPrice = (product: any, plan: string): number => {
    if (currency === 'USD') return product.prices[plan] || 0;
    if (product.currency_prices?.[currency]?.[plan]) return product.currency_prices[currency][plan];
    const usdPrice = product.prices[plan] || 0;
    return usdPrice * exchangeRate;
  };

  const formatDisplayPrice = (price: number) => {
    switch (currency) {
      case 'GBP': return `£${price.toFixed(2)}`;
      case 'INR': return `₹${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'PKR': return `Rs. ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'BDT': return `৳${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'NPR': return `Rs. ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default: return `$${price.toFixed(2)}`;
    }
  };

  const baseUnitPrice = getPrice(selectedProduct, selectedPlan);
  const totalBasePrice = baseUnitPrice * quantity;
  
  let bulkDiscountPercent = 0;
  if (quantity >= 4) bulkDiscountPercent = 0.50; 
  else if (quantity === 3) bulkDiscountPercent = 0.30; 
  else if (quantity === 2) bulkDiscountPercent = 0.15; 

  const bulkDiscountAmount = totalBasePrice * bulkDiscountPercent;
  const priceAfterBulk = totalBasePrice - bulkDiscountAmount;
  
  const finalPrice = appliedPromo ? Math.max(0, priceAfterBulk - appliedPromo.discount) : priceAfterBulk;
  
  const canPayWithWallet = localizedBalance >= finalPrice;
  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);

  const handleCopy = (text: string, label: string) => { 
    navigator.clipboard.writeText(text); 
    setCopied(label); 
    setTimeout(() => setCopied(''), 2000); 
    toast({ description: "Copied to clipboard", className: "bg-emerald-500 text-white border-none" });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidating(true);
    try {
      const res = await api.post('/promos/validate', { code: promoCode, cartTotal: priceAfterBulk });
      setAppliedPromo({ code: res.data.data.code, discount: res.data.data.discountAmount });
      toast({ title: 'Promo Applied!', description: `You saved ${formatDisplayPrice(res.data.data.discountAmount)}`, className: "bg-emerald-500 text-white border-none" });
    } catch (error: any) {
      setAppliedPromo(null);
      toast({ title: 'Invalid Code', description: error.response?.data?.message || 'Code invalid', variant: 'destructive' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleWalletPurchase = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/orders/wallet', {
        productId: selectedProduct.id,
        plan: selectedPlan,
        quantity: quantity,
        price: finalPrice,  
        promoCode: appliedPromo?.code,
        currency: currency
      });

      const usdDeduction = finalPrice / exchangeRate;
      const newBalance = Number((user.balance - usdDeduction).toFixed(2));
      
      const currentToken = token || localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      if (currentToken) login({ ...user, balance: newBalance }, currentToken);

      clearCart();
      toast({ title: 'Purchase Successful! 🎉', description: `${quantity}x License keys added to dashboard.`, className: "bg-emerald-500 text-white border-none" });
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Purchase Failed', description: error.response?.data?.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleSubmitManual = async () => {
    // Check if it's the auto crypto method
    if (selectedMethod?.isAuto) {
      setIsSubmitting(true);
      try {
        const response = await api.post('/crypto/create-invoice', { 
            amount: finalPrice,
            currency: 'USD',
            productId: selectedProduct.id,
            plan: selectedPlan,
            quantity: quantity
        });
        
        if (response.data?.paymentUrl) {
            window.location.href = response.data.paymentUrl;
        } else {
            throw new Error("Failed to generate payment link");
        }
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || "Failed to contact gateway.", variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
      return; 
    }

    // Manual Upload logic
    if (!transactionId.trim() || !screenshot) return toast({ title: 'Missing Info', variant: 'destructive' });
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', selectedProduct.id);
      formData.append('plan', selectedPlan);
      formData.append('quantity', quantity.toString());
      formData.append('price', finalPrice.toString());
      formData.append('currency', currency);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('paymentScreenshot', screenshot); 

      await api.post('/orders', formData);
      clearCart();
      toast({ title: 'Order Placed!', description: 'Waiting for Admin approval.', className: "bg-cyan-500 text-black border-none" });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Order Failed', description: error.response?.data?.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setScreenshot(e.target.files[0]); };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto relative z-10 py-6">
        
        <Button variant="ghost" className="mb-6 hover:bg-white/5 text-gray-400 hover:text-white" onClick={() => navigate('/shop')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Cancel & Return to Shop
        </Button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-gradient-to-r from-purple-600/20 via-cyan-500/20 to-purple-600/20 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250px_250px] animate-[pulse-glow_3s_linear_infinite]" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg tracking-wide uppercase">Unlock Massive Savings</h3>
                        <p className="text-cyan-200 text-sm font-medium">Buy multiple keys and stack your discounts instantly!</p>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10 text-xs font-black">
                    <div className={`px-4 py-2 rounded-lg border ${quantity === 2 ? 'bg-cyan-500 text-black border-cyan-400 scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-black/50 text-gray-400 border-white/10'} transition-all`}>2 Keys = 15% OFF</div>
                    <div className={`px-4 py-2 rounded-lg border ${quantity === 3 ? 'bg-cyan-500 text-black border-cyan-400 scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-black/50 text-gray-400 border-white/10'} transition-all`}>3 Keys = 30% OFF</div>
                    <div className={`px-4 py-2 rounded-lg border ${quantity >= 4 ? 'bg-cyan-500 text-black border-cyan-400 scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-black/50 text-gray-400 border-white/10'} transition-all`}>4+ Keys = 50% OFF</div>
                </div>
            </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-12 gap-8">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5">
            <Card className="sticky top-24 bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
              
              <CardHeader className="border-b border-white/[0.05] pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-400" /> Secure Checkout
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                  <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {selectedProduct.image ? <img src={selectedProduct.image} className="w-full h-full object-cover opacity-80" /> : <span className="text-2xl font-bold text-cyan-400">{selectedProduct.name.charAt(0)}</span>}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-cyan-500 text-black font-black text-xs flex items-center justify-center rounded-full border-2 border-black">x{quantity}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white leading-tight">{selectedProduct.name}</h3>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-2 px-2 py-0 font-medium tracking-wide uppercase text-[10px]">
                        {formatPlan(selectedPlan)} Plan
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/10">
                    <Label className="text-xs text-gray-400 font-bold uppercase tracking-widest pl-2">Quantity</Label>
                    <div className="flex items-center gap-3">
                        <button 
                            disabled={quantity <= 1} 
                            onClick={() => { setQuantity(quantity - 1); setAppliedPromo(null); }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="font-black text-lg w-6 text-center">{quantity}</span>
                        <button 
                            onClick={() => { setQuantity(quantity + 1); setAppliedPromo(null); }}
                            className="w-8 h-8 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 flex items-center justify-center transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Have a Promo Code?</Label>
                    <div className="flex gap-2 relative">
                        <Input 
                            placeholder="Enter code..." 
                            value={promoCode} 
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())} 
                            disabled={!!appliedPromo} 
                            className="bg-black/50 border-white/10 text-white focus-visible:ring-cyan-500/30 uppercase font-mono tracking-widest"
                        />
                        {appliedPromo ? (
                            <Button variant="destructive" onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="bg-red-500/20 text-red-400 hover:bg-red-500/40 w-12 border border-red-500/30">X</Button>
                        ) : (
                            <Button variant="outline" onClick={handleApplyPromo} disabled={isValidating || !promoCode} className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 w-12 transition-all">
                                {isValidating ? <Loader2 className="animate-spin h-4 w-4" /> : <Tag className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="bg-black/30 rounded-xl p-5 border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-400">Base Subtotal ({quantity}x)</span>
                      <span className="text-white">{formatDisplayPrice(totalBasePrice)}</span>
                  </div>
                  
                  {bulkDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm font-bold text-cyan-400">
                          <span>Bulk Discount ({(bulkDiscountPercent * 100).toFixed(0)}%)</span>
                          <span>-{formatDisplayPrice(bulkDiscountAmount)}</span>
                      </div>
                  )}

                  {appliedPromo && (
                      <div className="flex justify-between text-sm font-bold text-emerald-400">
                          <span>Promo ({appliedPromo.code})</span>
                          <span>-{formatDisplayPrice(appliedPromo.discount)}</span>
                      </div>
                  )}
                  
                  <div className="w-full h-px bg-white/10 my-1" />
                  <div className="flex justify-between items-end pt-1">
                      <span className="text-sm font-bold text-gray-300">Total Payable</span>
                      <div className="text-right">
                          {bulkDiscountPercent > 0 && <p className="text-xs text-gray-500 line-through mb-1">{formatDisplayPrice(totalBasePrice)}</p>}
                          <span className="text-3xl font-black text-white tracking-tight">{formatDisplayPrice(finalPrice)}</span>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7">
            {canPayWithWallet ? (
              <Card className="bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.1)] backdrop-blur-xl h-full flex flex-col justify-center">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                        <Zap className="h-8 w-8 text-cyan-400 fill-cyan-400" /> 
                    </div>
                    <CardTitle className="text-2xl font-black text-white">Instant Deployment</CardTitle>
                    <CardDescription className="text-gray-400 mt-2 font-medium">Funds available. Keys will be delivered instantly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-8 flex-1 flex flex-col justify-center">
                  
                  <div className="p-6 bg-black/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                    
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 relative z-10">Wallet Balance</p>
                    <p className="text-5xl font-black text-white mb-6 relative z-10 tracking-tighter">{formatDisplayPrice(localizedBalance)}</p>
                    
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6 relative z-10" />
                    
                    <div className="flex justify-between w-full max-w-[200px] text-sm relative z-10 font-medium">
                        <span className="text-gray-400">Remaining after:</span>
                        <span className="text-emerald-400 font-bold">{formatDisplayPrice(localizedBalance - finalPrice)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full text-lg h-14 font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all rounded-xl mt-auto" 
                    onClick={handleWalletPurchase} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authorizing...</> : `Confirm Payment of ${formatDisplayPrice(finalPrice)}`}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/40 border-white/[0.05] shadow-xl backdrop-blur-xl">
                <CardHeader className="border-b border-white/[0.05] pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                        <CreditCard className="h-5 w-5 text-purple-400" /> Manual Payment
                    </CardTitle>
                    <CardDescription className="text-red-400 font-medium bg-red-500/10 px-3 py-1.5 rounded-md inline-block w-fit mt-3 border border-red-500/20">
                        Insufficient wallet balance ({formatDisplayPrice(localizedBalance)}).
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  
                  <div className="space-y-3">
                    <Label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select Gateway</Label>
                    <Select value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value)}>
                        <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus:ring-purple-500/30 font-medium">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1219] border-white/10 text-white">
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id} className="focus:bg-purple-500/20">
                                    <div className="flex items-center gap-3">
                                        <method.icon className={`h-4 w-4 ${method.isAuto ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-purple-400'}`} />
                                        <span className={method.isAuto ? 'font-bold text-emerald-400' : 'font-medium'}>{method.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>

                  {selectedMethod && (
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent pointer-events-none" />
                        <h4 className="font-bold text-white mb-6 relative z-10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            {selectedMethod.name} Details
                        </h4>
                        
                        <div className="relative z-10 space-y-5">
                            {selectedMethod.isAuto ? (
                                 <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
                                     <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                                     <p className="text-sm font-medium text-emerald-400">Automated Gateway: You will be redirected to complete the payment securely.</p>
                                 </div>
                            ) : (
                                <>
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

                                    <div className="space-y-3">
                                        {selectedMethod.details && Object.entries(selectedMethod.details).map(([key, val]) => (
                                          <div key={key} className="flex items-center justify-between bg-black/60 p-3.5 rounded-xl border border-white/10 hover:border-purple-500/40 transition-colors group">
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[9px] uppercase text-purple-400 font-black tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                              <span className="font-mono text-sm font-bold text-white truncate">{val}</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 rounded-lg ml-2 shrink-0 transition-all" onClick={() => handleCopy(val, key)}>
                                              {copied === key ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                  )}

                  {!selectedMethod?.isAuto && (
                      <>
                          <div className="w-full h-px bg-white/[0.05]" />

                          <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="transactionId" className="text-xs text-gray-400 font-bold uppercase tracking-widest">Transaction ID / Ref No <span className="text-red-500">*</span></Label>
                                <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="h-12 bg-black/50 border-white/10 text-white focus-visible:ring-purple-500/30 rounded-xl font-mono placeholder:font-sans placeholder:text-gray-600" placeholder="Paste ID here..." />
                            </div>
                            
                            <div className="space-y-3">
                                <Label htmlFor="screenshot" className="text-xs text-gray-400 font-bold uppercase tracking-widest">Payment Screenshot <span className="text-red-500">*</span></Label>
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${screenshot ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/30 bg-black/30 hover:bg-white/[0.02]'}`} onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                                    {screenshot ? (
                                        <div className="flex items-center justify-center gap-2 text-purple-400 font-bold">
                                            <CheckCircle className="h-5 w-5" /> {screenshot.name}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-gray-300">
                                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <Upload className="h-5 w-5 text-gray-400" /> 
                                            </div>
                                            <span className="font-medium text-sm">Click to browse files</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                          </div>
                      </>
                  )}

                  <Button 
                    className={`w-full h-14 text-base font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] border-none rounded-xl transition-all disabled:opacity-50 ${selectedMethod?.isAuto ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                    onClick={handleSubmitManual} 
                    disabled={isSubmitting || (!selectedMethod?.isAuto && (!transactionId || !screenshot))}
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</> : selectedMethod?.isAuto ? `Proceed to Secure Gateway` : `Submit ${formatDisplayPrice(finalPrice)} Payment Verification`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}