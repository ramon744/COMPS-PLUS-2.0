export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: "manager_day" | "manager_night" | "admin";
  ativo: boolean;
  criadoEm: string;
}

export interface Manager {
  id: string;
  nome: string;
  usuario: string;
  senha: string;
  tipoAcesso: "qualquer_ip" | "ip_especifico";
  ipPermitido?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Waiter {
  id: string;
  nome: string;
  matricula?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CompType {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Comp {
  id: string;
  compTypeId: string;
  waiterId: string;
  valorCentavos: number;
  motivo: string;
  fotoUrl?: string;
  dataHoraLocal: string;
  dataHoraUtc: string;
  diaOperacional: string; // YYYY-MM-DD
  turno: "manha" | "noite";
  gerenteId: string;
  status: "ativo" | "cancelado";
  canceladoMotivo?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Closing {
  id: string;
  diaOperacional: string;
  periodoInicioLocal: string;
  periodoFimLocal: string;
  totalValorCentavos: number;
  totalQtd: number;
  fechadoPor: string;
  fechadoEmLocal: string;
  enviadoPara: string[];
  urlPdf?: string;
  urlCsv?: string;
  versao: number;
  observacao?: string;
  criadoEm: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  payloadResumo: string;
  criadoEmLocal: string;
  criadoEmUtc: string;
}