import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const { signIn, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
    }
  };

  const fillDemoCredentials = (userType: 'alice' | 'roberto') => {
    if (userType === 'alice') {
      setEmail('alice');
      setPassword('123456');
    } else {
      setEmail('roberto');
      setPassword('123456');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-float">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bem-vindo</h1>
          <p className="text-muted-foreground">Faça login para acessar o sistema</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Usuário</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full shadow-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full mb-2"
                onClick={() => setShowDemoInfo(!showDemoInfo)}
                type="button"
              >
                Ver credenciais de demonstração
              </Button>

              {showDemoInfo && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">Credenciais de demonstração:</p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fillDemoCredentials('alice')}
                          type="button"
                        >
                          Alice
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          alice / 123456
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fillDemoCredentials('roberto')}
                          type="button"
                        >
                          Roberto
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          roberto / 123456
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sistema de autenticação integrado com Supabase.<br />
                Para criar novos usuários, utilize a aba Cadastros → Gerentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;