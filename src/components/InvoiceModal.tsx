import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, XCircle } from 'lucide-react';
import { formatPlan, formatDate } from '@/store';

// ✅ Currency Exchange Logic
const exchangeRates: Record<string, number> = { 
  USD: 1, GBP: 0.79, INR: 83.50, PKR: 278.00, BDT: 117.00 
};

const getSymbol = (curr: string) => {
  switch(curr) { 
    case 'GBP': return '£'; 
    case 'INR': return '₹'; 
    case 'PKR': return 'Rs. '; 
    case 'BDT': return '৳'; 
    default: return '$'; 
  }
};

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  user: any;
  currency: string; // ✅ Added Prop
}

export function InvoiceModal({ isOpen, onClose, order, user, currency }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order || !user) return null;

  // ✅ Helper to convert price inside the modal
  const convertPrice = (amountInUsd: number) => {
    const selectedCurrency = currency || 'USD';
    const rate = exchangeRates[selectedCurrency] || 1;
    const converted = Number(amountInUsd) * rate;
    const symbol = getSymbol(selectedCurrency);
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); 
    }
  };

  const product = order.products || {};
  const isPaid = order.status === 'completed';
  
  // Calculate converted price
  const displayPrice = convertPrice(Number(order.price));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Invoice #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Layout */}
        <div className="p-6 bg-white text-black rounded-lg shadow-sm" ref={printRef}>
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">Universal Store</h1>
              <p className="text-sm text-gray-500">Premium Software Licensing</p>
              <p className="text-sm text-gray-500">support@universalstore.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">INVOICE</h2>
              <p className="text-sm text-gray-600">Date: {formatDate(order.createdAt || order.created_at)}</p>
              <p className="text-sm text-gray-600">Order ID: #{order.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-semibold">{user.name || user.full_name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          {/* Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 font-semibold">Description</th>
                <th className="text-left py-2 font-semibold">Plan</th>
                <th className="text-right py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4">
                  <p className="font-medium">{product.name || 'Software Product'}</p>
                  <p className="text-xs text-gray-500">License Key Delivery</p>
                </td>
                <td className="py-4 text-gray-600">{formatPlan(order.plan)}</td>
                <td className="py-4 text-right font-medium">{displayPrice}</td>
              </tr>
            </tbody>
          </table>

          {/* Total & Status */}
          <div className="flex justify-end mb-8">
            <div className="w-1/2 space-y-2">
              <div className="flex justify-between text-lg font-bold border-t border-black pt-2">
                <span>Total ({currency})</span>
                <span>{displayPrice}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-600">Payment Status:</span>
                <span className={`flex items-center gap-1 text-sm font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {isPaid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Method:</span>
                <span className="text-sm font-medium uppercase">{order.payment_method || 'Wallet'}</span>
              </div>
              {order.transaction_id && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <span className="text-xs font-mono">{order.transaction_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-6">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}