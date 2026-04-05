import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
}

export function ResetRequestModal({ isOpen, onClose, orderId, productId, productName }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/resets', {
        orderId,
        productId,
        username,
        password
      });
      
      toast({ 
        title: 'Request Sent', 
        description: 'Admin will review your credential reset request.' 
      });
      
      onClose();
      setUsername('');
      setPassword('');
      
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to send request', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Credentials</DialogTitle>
          <DialogDescription>
            Request a username/password reset for <strong>{productName}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Username / Email</Label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter current username" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Password Detail</Label>
            <Input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password or issue details" 
              required 
            />
          </div>
          
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}