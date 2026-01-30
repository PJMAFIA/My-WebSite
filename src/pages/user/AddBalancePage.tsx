import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Upload, 
  Copy, 
  Check,
  CreditCard,
  Smartphone,
  Building2,
  Bitcoin,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuthStore, useBalanceRequestStore } from '@/store';
import { useToast } from '@/hooks/use-toast';

const paymentMethods = [
  { id: 'upi', name: 'UPI', icon: Smartphone, details: { upiId: 'business@paytm' } },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, details: { walletAddress: '0x1234...5678', network: 'ETH/BNB/USDT' } },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, details: { accountName: 'SaaSify Inc.', accountNumber: '1234567890', ifsc: 'HDFC0001234', bankName: 'HDFC Bank' } },
  { id: 'paypal', name: 'PayPal', icon: CreditCard, details: { email: 'payments@saasify.com' } },
];

const presetAmounts = [10, 25, 50, 100, 250, 500];

export default function AddBalancePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addBalanceRequest } = useBalanceRequestStore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  
  // Image State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      // Create preview for UI
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid Amount', description: 'Enter valid amount.', variant: 'destructive' });
      return;
    }
    if (!paymentMethod) {
      toast({ title: 'Missing Method', description: 'Select payment method.', variant: 'destructive' });
      return;
    }
    if (!transactionId.trim()) {
      toast({ title: 'Missing Info', description: 'Enter transaction ID.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      
      if (screenshotFile) {
        formData.append('paymentScreenshot', screenshotFile);
      }

      // Call API Store Action
      await addBalanceRequest(formData);

      toast({
        title: 'Payment Submitted',
        description: 'Your request is under review by Admin.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit request.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Wallet className="h-7 w-7 text-primary" />
              Add Balance
            </h1>
            <p className="text-muted-foreground">
              Add funds to your account wallet
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Select Amount</CardTitle>
              <CardDescription>Choose a preset amount or enter custom value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset.toString() ? 'default' : 'outline'}
                    onClick={() => setAmount(preset.toString())}
                    className="h-12"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  type="number"
                  placeholder="Enter custom amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg h-12"
                  min="1"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
              <CardDescription>Select your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Details */}
              {selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-secondary/50 space-y-3"
                >
                  <p className="text-sm font-medium text-primary mb-3">Payment Details</p>
                  
                  {paymentMethod === 'upi' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">UPI ID</p>
                        <p className="font-mono">{selectedMethod.details.upiId}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.upiId!, 'upi')}>
                        {copied === 'upi' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}

                  {paymentMethod === 'crypto' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Wallet Address</p>
                          <p className="font-mono text-sm">{selectedMethod.details.walletAddress}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.walletAddress!, 'wallet')}>
                          {copied === 'wallet' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Supported Networks</p>
                        <p className="text-sm">{selectedMethod.details.network}</p>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs text-muted-foreground">Bank</p><p className="text-sm font-medium">{selectedMethod.details.bankName}</p></div>
                        <div><p className="text-xs text-muted-foreground">IFSC</p><p className="font-mono text-sm">{selectedMethod.details.ifsc}</p></div>
                        <div className="col-span-2 flex items-center justify-between">
                          <div><p className="text-xs text-muted-foreground">Account No.</p><p className="font-mono text-sm">{selectedMethod.details.accountNumber}</p></div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.accountNumber!, 'account')}>
                            {copied === 'account' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-muted-foreground">PayPal Email</p><p className="font-mono text-sm">{selectedMethod.details.email}</p></div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleCopy(selectedMethod.details.email!, 'paypal')}>
                        {copied === 'paypal' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Details</CardTitle>
              <CardDescription>Provide proof of your payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Screenshot (Optional)</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Screenshot" className="max-h-32 mx-auto rounded-lg" />
                      <p className="text-sm text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={isSubmitting || !amount || !paymentMethod || !transactionId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Submit Payment (${amount || '0'})
              </>
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}