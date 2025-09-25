import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Lock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, isLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Redirecionar se já estiver logado
  useEffect(() => {
    // Só redirecionar se não está carregando E tem usuário
    if (!isLoading && user) {
      console.log('✅ Usuário já logado, redirecionando para:', from);
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    // Validação básica
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: loginError } = await signIn(email.trim(), password);
      
      if (loginError) {
        setError(loginError);
        toast({
          title: "Erro no login",
          description: loginError,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!",
        });
        // O redirecionamento será feito pelo useEffect
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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
    setError('');
  };

  // Se está carregando a autenticação inicial, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">COMPS PLUS</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário/Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Digite seu usuário ou email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !email.trim() || !password.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Credenciais de demonstração */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Credenciais de demonstração:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('alice')}
                disabled={isSubmitting}
                className="text-xs"
              >
                Alice (Gerente)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('roberto')}
                disabled={isSubmitting}
                className="text-xs"
              >
                Roberto (Gerente)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;