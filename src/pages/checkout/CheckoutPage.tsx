import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  ArrowLeft,
  Copy,
  Wallet,
  QrCode,
  Loader2,
  Zap
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

type PaymentMethod = 'upi' | 'crypto' | 'bank_transfer' | 'paypal';

const paymentDetails: Record<PaymentMethod, { title: string; details: React.ReactNode }> = {
  upi: {
    title: 'UPI Payment',
    details: (
      <div className="space-y-4">
        <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
          <QrCode className="w-40 h-40 text-black" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">UPI ID</p>
          <p className="font-mono font-medium">payments@saasify</p>
        </div>
      </div>
    ),
  },
  crypto: {
    title: 'Cryptocurrency',
    details: (
      <div className="space-y-4">
        <div className="p-4 bg-secondary/50 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">USDT (TRC20)</p>
          <code className="text-xs break-all font-mono">TJYJxuM2zN3qo5qVrTbVxV5xqP3sYvHf8m</code>
        </div>
        <p className="text-xs text-muted-foreground text-center">Only send USDT on TRC20 network</p>
      </div>
    ),
  },
  bank_transfer: {
    title: 'Bank Transfer',
    details: (
      <div className="space-y-3">
        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Account Number</p>
          <p className="font-medium font-mono">1234567890</p>
        </div>
        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground">SWIFT Code</p>
          <p className="font-medium font-mono">FNBKUS44XXX</p>
        </div>
      </div>
    ),
  },
  paypal: {
    title: 'PayPal',
    details: (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Send payment to</p>
          <p className="font-medium">paypal@saasify.com</p>
        </div>
      </div>
    ),
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { selectedProduct, selectedPlan, clearCart } = useCartStore();
  
  // ✅ FIX 1: Extract 'token' to ensure we don't lose it during update
  // Cast to 'any' to avoid TS errors if your interface doesn't explicitly expose token
  const { user, isAuthenticated, login, token } = useAuthStore() as any;
  
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    if (!selectedProduct || !selectedPlan) {
      navigate('/shop');
    }
  }, [isAuthenticated, selectedProduct, selectedPlan, navigate]);

  if (!selectedProduct || !selectedPlan || !user) return null;

  const price = selectedProduct.prices[selectedPlan as keyof typeof selectedProduct.prices];
  
  const canPayWithWallet = user.balance >= price;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  // 🔵 PAY WITH WALLET
  const handleWalletPurchase = async () => {
    setIsSubmitting(true);
    try {
      // 1. Call API
      const response = await api.post('/orders/wallet', {
        productId: selectedProduct.id,
        plan: selectedPlan,
        price: price
      });

      // 2. Calculate new balance
      const newBalance = Number((user.balance - price).toFixed(2));
      
      // ✅ FIX 2: PRESERVE THE TOKEN (Crucial Step)
      // Check store first, then local storage fallback
      const currentToken = token || localStorage.getItem('auth_token') || localStorage.getItem('token') || '';

      if (currentToken) {
        login({ ...user, balance: newBalance }, currentToken);
      } else {
        console.warn("⚠️ Token not found during balance update. Session might be unstable.");
      }

      // 3. Success
      clearCart();
      toast({
        title: 'Purchase Successful! 🎉',
        description: 'License key has been added to your dashboard.',
      });
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Wallet Purchase Error:", error);
      
      if (error.response?.status === 401) {
        toast({ title: 'Session Expired', description: 'Please login again.', variant: 'destructive' });
        navigate('/login');
      } else {
        toast({
          title: 'Purchase Failed',
          description: error.response?.data?.message || 'Out of Stock or Server Error',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟠 MANUAL PAYMENT
  const handleSubmitManual = async () => {
    if (!transactionId.trim()) {
      toast({ title: 'Missing Info', description: 'Enter Transaction ID.', variant: 'destructive' });
      return;
    }
    if (!screenshot) {
      toast({ title: 'Missing Proof', description: 'Upload screenshot.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', selectedProduct.id);
      formData.append('plan', selectedPlan);
      formData.append('price', price.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('paymentScreenshot', screenshot); 

      await api.post('/orders', formData);

      clearCart();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setScreenshot(null);
      setTransactionId('');
      
      toast({
        title: 'Order Placed!',
        description: 'Waiting for Admin approval.',
      });
      navigate('/dashboard');

    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'Error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/shop')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <Card variant="glass" className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {selectedProduct.image ? (
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl font-bold text-primary">{selectedProduct.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatPlan(selectedPlan)} Plan</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">${price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* DYNAMIC PAYMENT SECTION */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            
            {/* 🟢 SCENARIO A: Wallet Has Money (Instant Buy) */}
            {canPayWithWallet ? (
              <Card variant="glass" className="border-primary/50 shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    Instant Checkout
                  </CardTitle>
                  <CardDescription>
                    Pay securely using your wallet balance. No waiting time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 bg-primary/10 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                    <p className="text-4xl font-bold text-primary mb-4">${user.balance.toFixed(2)}</p>
                    <div className="h-px w-full bg-border mb-4" />
                    <p className="text-sm text-muted-foreground">
                      After purchase: <span className="text-foreground font-medium">${(user.balance - price).toFixed(2)}</span>
                    </p>
                  </div>

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full text-lg h-14"
                    onClick={handleWalletPurchase}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : `Pay $${price.toFixed(2)} & Get Key Now`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Instant Delivery • Secure Payment
                  </p>
                </CardContent>
              </Card>

            ) : (
            
            /* 🔴 SCENARIO B: Insufficient Balance (Manual Upload) */
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Add Funds / Pay Manually
                  </CardTitle>
                  <CardDescription>
                    Your wallet balance ($ {user.balance.toFixed(2)}) is insufficient. Please pay directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Method Selector */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                      <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI / PhonePe</SelectItem>
                        <SelectItem value="crypto">Crypto (USDT)</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Details Box */}
                  <div className="p-6 bg-secondary/30 rounded-xl relative group">
                    <div className="absolute top-4 right-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleCopy("payment-info")}>
                      <Copy className="h-4 w-4" />
                    </div>
                    <h4 className="font-medium mb-4">{paymentDetails[paymentMethod].title}</h4>
                    {paymentDetails[paymentMethod].details}
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID *</Label>
                      <Input id="transactionId" placeholder="Enter transaction reference no." value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="screenshot">Payment Screenshot *</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                        {screenshot ? (
                          <div className="flex items-center justify-center gap-2 text-primary font-medium">
                            <CheckCircle className="h-5 w-5" /> {screenshot.name}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" /> <span>Click to upload screenshot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="gradient" size="lg" className="w-full" onClick={handleSubmitManual} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Submit Order'}
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