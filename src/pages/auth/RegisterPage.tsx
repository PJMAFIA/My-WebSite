import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { supabase } from '@/lib/supabase';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification State
  const [step, setStep] = useState<1 | 2>(1); // 1: Details, 2: Verification
  const [verificationCode, setVerificationCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // 🚀 Call Backend to Send Email
      await api.post('/auth/send-code', { email, password, name });

      toast({
        title: 'Verification Code Sent',
        description: `We sent a 6-digit code to ${email}. Check your inbox!`,
        className: "bg-cyan-500 text-black border-none"
      });
      
      setStep(2); // Move to next step

    } catch (error) {
      const axiosError = error as AxiosError<{message: string}>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.message || 'Failed to send code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify & Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Code must be 6 digits', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // 🚀 Call Backend to Verify & Create Account
      await api.post('/auth/verify-register', {
        email,
        password,
        full_name: name,
        code: verificationCode
      });

      toast({
        title: 'Account Created!',
        description: 'You have been successfully registered.',
        className: "bg-emerald-500 text-black border-none"
      });
      
      navigate('/login');

    } catch (error) {
      const axiosError = error as AxiosError<{message: string}>;
      toast({
        title: 'Verification Failed',
        description: axiosError.response?.data?.message || 'Invalid code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Google Sign-up Failed', description: error.message, variant: 'destructive' });
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-black/60 border border-white/[0.05] shadow-2xl backdrop-blur-xl w-full max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
        
        <CardHeader className="text-center pb-2">
          <Link to="/" className="lg:hidden flex items-center justify-center mb-6 mt-2">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-2xl object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
          </Link>
          <CardTitle className="text-3xl font-black text-white tracking-tight">
            {step === 1 ? 'Initiate Access' : 'Verify Credentials'}
          </CardTitle>
          <CardDescription className="text-gray-400 font-medium mt-2">
            {step === 1 ? 'Create your secure account to continue' : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Button 
                    variant="outline" 
                    className="w-full mb-6 h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold transition-all" 
                    onClick={handleGoogleLogin} 
                    disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-[#0a0d14] px-4 text-gray-500">Or register with email</span>
                  </div>
                </div>

                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Alias / Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input id="name" placeholder="Enter your display name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 rounded-xl" />
                    </div>
                    {errors.name && <p className="text-xs text-red-400 font-medium">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input id="email" type="email" placeholder="Secure email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 rounded-xl" />
                    </div>
                    {errors.email && <p className="text-xs text-red-400 font-medium">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 rounded-xl" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 font-medium">{errors.password}</p>}
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label htmlFor="confirmPassword" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 rounded-xl" />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400 font-medium">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full h-12 text-md font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] rounded-xl transition-all" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Verification Code */}
            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyAndRegister} 
                className="space-y-8 py-4"
              >
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-xl text-center">
                  <p className="text-sm text-cyan-400 font-medium">
                    A secure clearance code has been dispatched to <br/><span className="font-bold text-white mt-1 inline-block">{email}</span>
                  </p>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-white mt-3 font-bold uppercase tracking-wider transition-colors">
                    Incorrect Email? Go back
                  </button>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="code" className="text-xs text-gray-400 font-bold uppercase tracking-wider flex justify-between">
                      <span>Verification Code</span>
                      <span>6 Digits</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input 
                      id="code" 
                      placeholder="• • • • • •" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      className="pl-12 text-center tracking-[1em] font-mono text-2xl h-16 bg-black/60 border-white/20 text-white focus-visible:ring-cyan-500/50 rounded-xl placeholder:tracking-normal placeholder:text-gray-600"
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black border-none shadow-[0_0_20px_rgba(16,185,129,0.4)] rounded-xl transition-all" disabled={isLoading || verificationCode.length < 6}>
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>Verify & Initialize <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-sm text-gray-400 font-medium">
              Already have clearance?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition-colors">Sign in</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}