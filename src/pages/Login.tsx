import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Lock, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [email, setEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(usuario, senha);
    if (!error) {
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    
    try {
      // Verificar se o email existe na tabela de gerentes ativos
      const { data: manager, error: managerError } = await supabase
        .from('managers')
        .select('id, nome, usuario')
        .eq('usuario', email.trim())
        .eq('ativo', true)
        .single();

      if (managerError || !manager) {
        toast({
          title: "Email não encontrado",
          description: "Este email não está cadastrado como gerente ativo no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Enviar email de recuperação via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error('Erro ao enviar email de recuperação:', resetError);
        toast({
          title: "Erro",
          description: "Erro ao enviar email de recuperação. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setResetEmailSent(true);
      toast({
        title: "Email enviado!",
        description: `Um link de recuperação foi enviado para ${email}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Erro ao processar recuperação de senha:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const goBackToLogin = () => {
    setShowForgotPassword(false);
    setEmail('');
    setResetEmailSent(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-float">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Recuperar Senha</h1>
            <p className="text-muted-foreground">Informe seu email para receber o link de recuperação</p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Esqueci minha senha</CardTitle>
              <CardDescription>
                {resetEmailSent 
                  ? "Verifique seu email e clique no link para redefinir sua senha"
                  : "Digite o email cadastrado como gerente no sistema"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      Email enviado com sucesso para <strong>{email}</strong>
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Verifique sua caixa de entrada</p>
                    <p>• Clique no link "Redefinir senha"</p>
                    <p>• Crie uma nova senha segura</p>
                  </div>

                  <Button
                    onClick={goBackToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full shadow-button"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isResettingPassword ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBackToLogin}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </form>
              )}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
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

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Esqueci minha senha
              </Button>
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

export default Login;