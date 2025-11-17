export interface Lancamento {
  id?: string;
  data: string;
  tipo: string;
  valor: number;
  status: string;
  unidade?: string;
  cliente_fornecedor?: string | null;
  descricao?: string | null;
  obs?: string | null;
  aluno?: string | null;
  parcela?: string | null;
  desc_pontual?: number | null;
  datapag?: string | null;
  categoria?: string | null;
  nota_fiscal?: string | null;
  forma_pagamento?: string | null;
  documento?: string | null;
}

export type LancamentoStatus = 'A Vencer' | 'Pago' | 'Atrasado' | 'Em Aberto' | string;
