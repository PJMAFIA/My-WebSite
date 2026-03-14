import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, Upload, CheckCircle, ArrowLeft, Copy, Wallet, QrCode, Loader2, Zap, Tag, ShieldCheck, Plus, Minus, Gift
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

type PaymentMethod = 'upi' | 'crypto' | 'bank_transfer' | 'paypal'; 

const paymentDetails: Record<PaymentMethod, { title: string; details: React.ReactNode }> = {
  upi: { title: 'UPI Payment', details: (<div className="space-y-4"><div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]"><QrCode className="w-40 h-40 text-black" /></div><div className="text-center"><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">UPI ID</p><p className="font-mono font-medium text-white bg-white/5 py-2 rounded-lg">payments@saasify</p></div></div>) },
  crypto: { title: 'Cryptocurrency', details: (<div className="space-y-4"><div className="p-4 bg-black/40 border border-white/10 rounded-xl"><p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">USDT (TRC20)</p><code className="text-xs break-all font-mono text-white select-all">TJYJxuM2zN3qo5qVrTbVxV5xqP3sYvHf8m</code></div><p className="text-xs text-gray-400 text-center font-medium">Only send USDT on TRC20 network</p></div>) },
  bank_transfer: { title: 'Bank Transfer', details: (<div className="space-y-3"><div className="p-3 bg-black/40 border border-white/10 rounded-lg"><p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Account Number</p><p className="font-bold font-mono text-white tracking-wider">1234567890</p></div><div className="p-3 bg-black/40 border border-white/10 rounded-lg"><p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">SWIFT Code</p><p className="font-bold font-mono text-white tracking-wider">FNBKUS44XXX</p></div></div>) },
  paypal: { title: 'PayPal', details: (<div className="space-y-4 text-center py-4"><div className="w-20 h-20 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]"><Wallet className="w-8 h-8 text-blue-400" /></div><div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Send payment to</p><p className="font-medium text-white bg-white/5 py-2 rounded-lg">paypal@saasify.com</p></div></div>) },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  // ✅ Added quantity to destructuring
  const { selectedProduct, selectedPlan, quantity, setQuantity, clearCart } = useCartStore();
  const { user, isAuthenticated, login, token } = useAuthStore() as any;
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ PROMO CODE STATE
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (!selectedProduct || !selectedPlan) navigate('/shop');
  }, [isAuthenticated, selectedProduct, selectedPlan, navigate]);

  if (!selectedProduct || !selectedPlan || !user) return null;

  // ✅ BULK DISCOUNT MATH
  const baseUnitPrice = selectedProduct.prices[selectedPlan as keyof typeof selectedProduct.prices];
  const totalBasePrice = baseUnitPrice * quantity;
  
  let bulkDiscountPercent = 0;
  if (quantity >= 4) bulkDiscountPercent = 0.50; // 50% off
  else if (quantity === 3) bulkDiscountPercent = 0.30; // 30% off
  else if (quantity === 2) bulkDiscountPercent = 0.15; // 15% off

  const bulkDiscountAmount = totalBasePrice * bulkDiscountPercent;
  const priceAfterBulk = totalBasePrice - bulkDiscountAmount;
  
  // Apply Promo after bulk discount
  const finalPrice = appliedPromo ? Math.max(0, priceAfterBulk - appliedPromo.discount) : priceAfterBulk;
  const canPayWithWallet = user.balance >= finalPrice;

  // ✅ PROMO HANDLER
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidating(true);
    try {
      // Send the current price (after bulk) so promo calculates percent correctly
      const res = await api.post('/promos/validate', { code: promoCode, cartTotal: priceAfterBulk });
      setAppliedPromo({ code: res.data.data.code, discount: res.data.data.discountAmount });
      toast({ title: 'Promo Applied!', description: `You saved $${res.data.data.discountAmount}`, className: "bg-emerald-500 text-white border-none" });
    } catch (error: any) {
      setAppliedPromo(null);
      toast({ title: 'Invalid Code', description: error.response?.data?.message || 'Code invalid', variant: 'destructive' });
    } finally {
      setIsValidating(false);
    }
  };

  // 🔵 WALLET PAY
  const handleWalletPurchase = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/orders/wallet', {
        productId: selectedProduct.id,
        plan: selectedPlan,
        quantity: quantity, // ✅ Added quantity
        price: finalPrice,  // Send final calculated price
        promoCode: appliedPromo?.code 
      });

      const newBalance = Number((user.balance - finalPrice).toFixed(2));
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

  // 🟠 MANUAL PAY
  const handleSubmitManual = async () => {
    if (!transactionId.trim() || !screenshot) return toast({ title: 'Missing Info', variant: 'destructive' });
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', selectedProduct.id);
      formData.append('plan', selectedPlan);
      formData.append('quantity', quantity.toString()); // ✅ Added quantity
      formData.append('price', finalPrice.toString());
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

        {/* 🔥 ATTRACTIVE BULK DISCOUNT BANNER */}
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
          
          {/* Order Summary (Left side on desktop) */}
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

                {/* ✅ QUANTITY SELECTOR */}
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
                
                {/* ✅ PROMO INPUT */}
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
                      <span className="text-white">${totalBasePrice.toFixed(2)}</span>
                  </div>
                  
                  {bulkDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm font-bold text-cyan-400">
                          <span>Bulk Discount ({(bulkDiscountPercent * 100).toFixed(0)}%)</span>
                          <span>-${bulkDiscountAmount.toFixed(2)}</span>
                      </div>
                  )}

                  {appliedPromo && (
                      <div className="flex justify-between text-sm font-bold text-emerald-400">
                          <span>Promo ({appliedPromo.code})</span>
                          <span>-${appliedPromo.discount.toFixed(2)}</span>
                      </div>
                  )}
                  
                  <div className="w-full h-px bg-white/10 my-1" />
                  <div className="flex justify-between items-end pt-1">
                      <span className="text-sm font-bold text-gray-300">Total Payable</span>
                      <div className="text-right">
                          {bulkDiscountPercent > 0 && <p className="text-xs text-gray-500 line-through mb-1">${totalBasePrice.toFixed(2)}</p>}
                          <span className="text-3xl font-black text-white tracking-tight">${finalPrice.toFixed(2)}</span>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* PAYMENT SECTION (Right side on desktop) */}
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
                    <p className="text-5xl font-black text-white mb-6 relative z-10 tracking-tighter">${user.balance.toFixed(2)}</p>
                    
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6 relative z-10" />
                    
                    <div className="flex justify-between w-full max-w-[200px] text-sm relative z-10 font-medium">
                        <span className="text-gray-400">Remaining after:</span>
                        <span className="text-emerald-400 font-bold">${(user.balance - finalPrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full text-lg h-14 font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all rounded-xl mt-auto" 
                    onClick={handleWalletPurchase} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authorizing...</> : `Confirm Payment of $${finalPrice.toFixed(2)}`}
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
                        Insufficient wallet balance (${user.balance.toFixed(2)}).
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  
                  <div className="space-y-3">
                    <Label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select Gateway</Label>
                    <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                        <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus:ring-purple-500/30 font-medium">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1219] border-white/10 text-white">
                            <SelectItem value="upi" className="focus:bg-purple-500/20">UPI / PhonePe</SelectItem>
                            <SelectItem value="crypto" className="focus:bg-purple-500/20">Crypto</SelectItem>
                            <SelectItem value="bank_transfer" className="focus:bg-purple-500/20">Bank Transfer</SelectItem>
                            <SelectItem value="paypal" className="focus:bg-purple-500/20">PayPal</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent pointer-events-none" />
                      <div className="absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-purple-400 transition-colors z-10 bg-black/50 p-2 rounded-lg backdrop-blur-sm" onClick={() => { navigator.clipboard.writeText("details"); toast({description: "Details copied"}) }}>
                          <Copy className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-white mb-6 relative z-10 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          {paymentDetails[paymentMethod].title}
                      </h4>
                      <div className="relative z-10">
                        {paymentDetails[paymentMethod].details}
                      </div>
                  </div>

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

                  <Button 
                    className="w-full h-14 text-base font-black bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border-none rounded-xl transition-all disabled:opacity-50" 
                    onClick={handleSubmitManual} 
                    disabled={isSubmitting || !transactionId || !screenshot}
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting Data...</> : `Submit $${finalPrice.toFixed(2)} Payment Verification`}
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