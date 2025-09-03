// Utilitário para testar a funcionalidade de logout por inatividade
// Para usar durante o desenvolvimento/teste

export const INACTIVITY_TEST_CONFIG = {
  // Configurações para teste rápido (30 segundos total, aviso aos 20 segundos)
  FAST_TEST: {
    timeout: 30 * 1000,     // 30 segundos
    warningTime: 10 * 1000, // 10 segundos de aviso
  },
  
  // Configurações para teste médio (2 minutos total, aviso aos 1:30)
  MEDIUM_TEST: {
    timeout: 2 * 60 * 1000,     // 2 minutos
    warningTime: 30 * 1000,     // 30 segundos de aviso
  },
  
  // Configurações de produção (2 horas total, aviso aos 5 minutos)
  PRODUCTION: {
    timeout: 2 * 60 * 60 * 1000, // 2 horas
    warningTime: 5 * 60 * 1000,   // 5 minutos de aviso
  }
};

// Função para simular inatividade (para testes)
export const simulateInactivity = () => {
  console.log('🧪 Simulando inatividade - removendo todos os event listeners temporariamente');
  
  // Salvar referências dos event listeners originais
  const originalAddEventListener = document.addEventListener;
  const originalRemoveEventListener = document.removeEventListener;
  
  // Substituir temporariamente para não adicionar novos listeners
  document.addEventListener = () => {};
  document.removeEventListener = () => {};
  
  // Restaurar após 1 segundo
  setTimeout(() => {
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
    console.log('🧪 Event listeners restaurados');
  }, 1000);
};

// Função para logar informações de debug sobre inatividade
export const logInactivityStatus = (lastActivity: number) => {
  const now = Date.now();
  const timeSinceActivity = now - lastActivity;
  const minutesSinceActivity = Math.floor(timeSinceActivity / 60000);
  const secondsSinceActivity = Math.floor((timeSinceActivity % 60000) / 1000);
  
  console.log(`🕐 Última atividade: ${minutesSinceActivity}m ${secondsSinceActivity}s atrás`);
};

// Configuração para usar durante desenvolvimento
export const getInactivityConfig = () => {
  // Usar sempre configuração de produção (2 horas)
  console.log('⏰ Usando configuração de produção: 2 horas de timeout');
  return INACTIVITY_TEST_CONFIG.PRODUCTION;
};
