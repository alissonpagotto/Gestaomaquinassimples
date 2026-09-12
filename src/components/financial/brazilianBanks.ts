export interface BrazilianBank {
  code: string;
  name: string;
  shortName: string;
  color?: string;
}

export const BRAZILIAN_BANKS: BrazilianBank[] = [
  { code: '001', name: 'Banco do Brasil S.A.', shortName: 'Banco do Brasil', color: '#facc15' },
  { code: '237', name: 'Banco Bradesco S.A.', shortName: 'Bradesco', color: '#cc092f' },
  { code: '341', name: 'Itaú Unibanco S.A.', shortName: 'Itaú', color: '#ec7000' },
  { code: '033', name: 'Banco Santander (Brasil) S.A.', shortName: 'Santander', color: '#ea1d25' },
  { code: '104', name: 'Caixa Econômica Federal', shortName: 'Caixa Econômica', color: '#0066b3' },
  { code: '260', name: 'Nu Pagamentos S.A. (Nubank)', shortName: 'Nubank', color: '#820ad1' },
  { code: '077', name: 'Banco Inter S.A.', shortName: 'Inter', color: '#ff7a00' },
  { code: '748', name: 'Banco Cooperativo Sicredi S.A.', shortName: 'Sicredi', color: '#00843d' },
  { code: '756', name: 'Banco Cooperativo Sicoob S.A.', shortName: 'Sicoob', color: '#003641' },
  { code: '041', name: 'Banco do Estado do Rio Grande do Sul (Banrisul)', shortName: 'Banrisul', color: '#004f9f' },
  { code: '336', name: 'Banco C6 S.A. (C6 Bank)', shortName: 'C6 Bank', color: '#242424' },
  { code: '290', name: 'PagBank / PagSeguro Internet S.A.', shortName: 'PagBank', color: '#00a868' },
  { code: '212', name: 'Banco Original S.A.', shortName: 'Banco Original', color: '#008542' },
  { code: '422', name: 'Banco Safra S.A.', shortName: 'Safra', color: '#b99b58' },
  { code: '004', name: 'Banco do Nordeste do Brasil (BNB)', shortName: 'Banco do Nordeste', color: '#b5121b' },
  { code: '003', name: 'Banco da Amazônia S.A. (BASA)', shortName: 'Banco da Amazônia', color: '#006633' },
  { code: '655', name: 'Banco Votorantim S.A. (BV)', shortName: 'Banco BV', color: '#002b66' },
  { code: '745', name: 'Banco Citibank S.A.', shortName: 'Citibank', color: '#003b70' },
  { code: '070', name: 'BRB - Banco de Brasília S.A.', shortName: 'BRB', color: '#00529b' },
  { code: '021', name: 'BANESTES S.A.', shortName: 'Banestes', color: '#004990' },
  { code: '380', name: 'PicPay Instituição de Pagamento S.A.', shortName: 'PicPay', color: '#11c76f' },
  { code: '085', name: 'Cooperativa Central de Crédito - Ailos', shortName: 'Ailos', color: '#00857c' },
  { code: '136', name: 'Unicred do Brasil', shortName: 'Unicred', color: '#005544' },
  { code: '208', name: 'Banco BTG Pactual S.A.', shortName: 'BTG Pactual', color: '#051937' },
  { code: '099', name: 'Caixa Sede / Espécie Físico', shortName: 'Caixa Físico', color: '#475569' },
  { code: '999', name: 'Outra Instituição Financeira / Cooperativa', shortName: 'Outra Instituição', color: '#334155' },
];

export function findBankByQuery(query: string): BrazilianBank | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  const digits = clean.replace(/\D/g, '');

  return BRAZILIAN_BANKS.find(
    (b) =>
      (digits && b.code === digits.padStart(3, '0')) ||
      b.code.toLowerCase() === clean ||
      b.shortName.toLowerCase() === clean ||
      b.name.toLowerCase() === clean
  );
}
