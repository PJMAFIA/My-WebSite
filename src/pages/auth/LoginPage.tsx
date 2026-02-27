import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 🚀 REAL BACKEND CALL
      const response = await api.post('/auth/login', {
        email,
        password
      });

      // ✅ FIX: Destructure 'token' (was previously expecting accessToken)
      const { user, token } = response.data.data;

      // Update State with Token
      login(user, token);

      toast({
        title: 'Authentication Successful',
        description: 'Welcome back to the command center.',
        className: "bg-emerald-500 text-white border-none",
      });

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      const axiosError = error as AxiosError<{message: string}>;
      toast({
        title: 'Access Denied',
        description: axiosError.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔵 Handle Google Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`, 
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Google Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-black/60 border border-white/[0.05] shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 blur-[80px] pointer-events-none" />
        
        <CardHeader className="text-center pb-6">
            <Link to="/" className="lg:hidden flex flex-col items-center justify-center gap-3 mb-6 group">
                <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-2xl object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform" />
                </div>
                <span className="font-black text-xl tracking-tight text-white">Universal Store</span>
            </Link>

            <div className="hidden lg:flex w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>

            <CardTitle className="text-3xl font-black text-white tracking-tight">Secure Login</CardTitle>
            <CardDescription className="text-gray-400 font-medium mt-2">
                Authenticate to access your dashboard
            </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Google Button */}
          <Button 
            variant="outline" 
            className="w-full h-12 bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-cyan-500/30 text-white transition-all font-bold" 
            onClick={handleGoogleLogin} 
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
            ) : (
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-[#0a0d14] px-4 text-gray-500 rounded-full border border-white/5">
                Or authorize with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50 rounded-xl transition-all"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 font-medium ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-12 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50 rounded-xl transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-400 font-medium ml-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border-none rounded-xl mt-2 transition-all"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Don't have clearance yet?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                Initialize Account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}