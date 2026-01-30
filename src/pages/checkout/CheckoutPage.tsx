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
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useCartStore, 
  useAuthStore, 
  formatPlan 
} from '@/store';
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
  const { user, isAuthenticated } = useAuthStore();
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

  // Ensure type safety for price lookup
  const price = selectedProduct.prices[selectedPlan as keyof typeof selectedProduct.prices];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!transactionId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your Transaction ID.',
        variant: 'destructive',
      });
      return;
    }

    if (!screenshot) {
      toast({
        title: 'Missing Proof',
        description: 'Please upload a payment screenshot.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Prepare FormData
      const formData = new FormData();
      // Ensure these keys match Backend Controller EXACTLY
      formData.append('productId', selectedProduct.id);
      formData.append('plan', selectedPlan);
      formData.append('price', price.toString());
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      
      // ✅ Crucial: Matches 'upload.single("paymentScreenshot")' in backend route
      formData.append('paymentScreenshot', screenshot); 

      // 3. Send Request
      // Note: We do NOT set 'Content-Type' header manually. 
      // Axios detects FormData and sets 'multipart/form-data' with the correct boundary automatically.
      await api.post('/orders', formData);

      // 4. Cleanup & Redirect
      clearCart();
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      setScreenshot(null);
      setTransactionId('');
      
      toast({
        title: 'Order Placed!',
        description: 'Your order is pending approval. Check your dashboard.',
      });
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Order Submit Error:", error);
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/shop')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card variant="glass" className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {selectedProduct.image && selectedProduct.image !== '/placeholder.svg' ? (
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl font-bold text-primary">
                        {selectedProduct.name.charAt(0)}
                        </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPlan(selectedPlan)} Plan
                    </p>
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

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Select method, pay, and upload proof.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Method Selector */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
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
                    <Input
                        id="transactionId"
                        placeholder="Enter transaction reference no."
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot *</Label>
                    <div 
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                        type="file" 
                        hidden 
                        ref={fileInputRef} 
                        accept="image/*"
                        onChange={handleFileUpload}
                        />
                        {screenshot ? (
                        <div className="flex items-center justify-center gap-2 text-primary font-medium">
                            <CheckCircle className="h-5 w-5" />
                            {screenshot.name}
                        </div>
                        ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <span>Click to upload screenshot</span>
                        </div>
                        )}
                    </div>
                    </div>
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Processing...
                    </>
                  ) : 'Submit Order'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your license key will be delivered to your dashboard instantly upon Admin approval.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}