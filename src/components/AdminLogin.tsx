import React, { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/contexts/AdminContext';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ open, onOpenChange }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdmin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login('BicaMarius', password);
    if (success) {
      toast.success('Conectat ca admin!', {
        description: 'Acum poți edita și administra portofoliul.',
        icon: (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#22c55e" />
            <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        duration: 3500,
      });
      onOpenChange(false);
      setPassword('');
      setError('');
    } else {
      setError('Parolă incorectă');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-gaming-accent/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gaming-accent">
            <Lock className="h-5 w-5" />
            Admin Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Parola Admin</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gaming-accent/20 focus:border-gaming-accent pr-10"
                placeholder="Introduceți parola de admin..."
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full bg-gaming-accent hover:bg-gaming-accent/80">
            Acces Admin
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};