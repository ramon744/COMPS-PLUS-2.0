import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bug, TestTube } from 'lucide-react';

interface TestErrorComponentProps {
  onTestError?: () => void;
}

export function TestErrorComponent({ onTestError }: TestErrorComponentProps) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Erro de teste gerado intencionalmente para verificar o ErrorBoundary');
  }

  const handleTestError = () => {
    setShouldThrow(true);
    onTestError?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <TestTube className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-blue-600">Teste de Error Boundary</CardTitle>
        <CardDescription>
          Este componente permite testar o sistema de tratamento de erros da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex">
            <Bug className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Funcionalidades de Teste
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Clique no botão abaixo para simular um erro e verificar se o ErrorBoundary está funcionando corretamente.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleTestError}
          className="w-full"
          variant="destructive"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Gerar Erro de Teste
        </Button>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>Este componente é apenas para fins de teste</p>
          <p>Use apenas em ambiente de desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
}
