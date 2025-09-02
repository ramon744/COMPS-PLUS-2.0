import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se há token de recuperação na URL (query params ou fragment)
  const getParamFromUrlOrFragment = (param: string) => {
    // Primeiro tenta query params
    const queryParam = searchParams.get(param);
    if (queryParam) return queryParam;
    
    // Se não encontrar, tenta no fragment
    const hash = window.location.hash;
    if (hash) {
      const fragmentParams = new URLSearchParams(hash.substring(1));
      return fragmentParams.get(param);
    }
    return null;
  };

  const accessToken = getParamFromUrlOrFragment('access_token');
  const refreshToken = getParamFromUrlOrFragment('refresh_token');
  const errorParam = getParamFromUrlOrFragment('error');
  const errorDescription = getParamFromUrlOrFragment('error_description');

  useEffect(() => {
    console.log('🔧 DEBUG - ResetPassword params:', {
      accessToken: accessToken ? 'PRESENTE' : 'AUSENTE',
      refreshToken: refreshToken ? 'PRESENTE' : 'AUSENTE',
      error: errorParam,
      errorDescription: errorDescription,
      fullURL: window.location.href
    });

    if (errorParam) {
      if (errorParam === 'access_denied' && errorDescription?.includes('expired')) {
        setError('Link de recuperação expirado. Por favor, solicite um novo link através da tela de login.');
      } else {
        setError(`Erro: ${errorDescription || errorParam}`);
      }
    } else if (!accessToken || !refreshToken) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
    }
  }, [accessToken, refreshToken, errorParam, errorDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('Link de recuperação inválido.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔧 DEBUG - Iniciando atualização de senha...');
      
      // Primeiro, estabelecer a sessão com os tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!
      });

      if (sessionError) {
        console.error('Erro ao estabelecer sessão:', sessionError);
        setError('Token de recuperação inválido ou expirado.');
        return;
      }

      console.log('✅ Sessão estabelecida com sucesso');

      // Atualizar a senha usando o token de recuperação
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        setError('Erro ao atualizar senha. Tente novamente.');
        return;
      }

      console.log('✅ Senha atualizada com sucesso');

      setIsSuccess(true);
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso.",
        variant: "default",
      });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

    } catch (error) {
      console.error('Erro inesperado:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 shadow-float">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Senha Atualizada!</h1>
            <p className="text-muted-foreground">Sua senha foi redefinida com sucesso</p>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Senha atualizada com sucesso!
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para a tela de login em alguns segundos...
                </p>

                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-float">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Nova Senha</h1>
          <p className="text-muted-foreground">Digite sua nova senha</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full shadow-button"
                disabled={isLoading || !accessToken || !refreshToken}
              >
                {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full"
              >
                Voltar ao Login
              </Button>

              {(errorParam === 'access_denied' || !accessToken) && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Link expirado? Solicite um novo através da tela de login.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/login', { replace: true })}
                    className="text-sm"
                  >
                    Ir para Login → Esqueci minha senha
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
