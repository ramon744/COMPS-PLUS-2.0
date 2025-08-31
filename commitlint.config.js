module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação de código
        'refactor', // Refatoração
        'perf',     // Melhorias de performance
        'test',     // Adicionar ou corrigir testes
        'chore',    // Tarefas de manutenção
        'ci',       // Configurações de CI/CD
        'build',    // Alterações no sistema de build
        'revert'    // Reverter commit anterior
      ]
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100]
  }
};
