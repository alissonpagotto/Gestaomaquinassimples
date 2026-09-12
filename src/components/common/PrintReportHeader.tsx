import React from 'react';
import { CompanyProfile } from '../../types';
import { getStoredCompanyProfile } from '../../lib/storage';
import { Building2 } from 'lucide-react';

export interface PrintReportHeaderProps {
  companyProfile?: CompanyProfile | null;
  reportTitle?: string;
  reportSubtitle?: string;
  documentTypeBadge?: string;
  className?: string;
  showDivider?: boolean;
}

/**
 * Standardized Corporate Print Report Header
 * 2 Columns:
 * - Left: Company Logo (dynamically loaded from Company Settings) or stylized monogram fallback
 * - Right: Trade Name (Nome Fantasia) in bold highlight, with CNPJ and City/UF directly below
 * Separated by a subtle horizontal divider line in corporate blue / dark gray.
 */
export const PrintReportHeader: React.FC<PrintReportHeaderProps> = ({
  companyProfile,
  reportTitle,
  reportSubtitle,
  documentTypeBadge,
  className = '',
  showDivider = true,
}) => {
  const company = companyProfile || getStoredCompanyProfile();

  const tradeName =
    company?.tradeName ||
    company?.companyName ||
    company?.corporateName ||
    'Silagem Fácil - Gestão Agrícola';

  const corporateName = company?.corporateName && company.corporateName !== tradeName ? company.corporateName : null;

  const cnpj = company?.cnpjCpf || company?.cnpj || '';
  const cityUf = [company?.city, company?.state].filter(Boolean).join(' / ');
  const contact = [company?.phone, company?.email].filter(Boolean).join(' • ');
  const address = company?.address ? `${company.address}${company.number ? `, nº ${company.number}` : ''}` : '';

  return (
    <header className={`print-corporate-header w-full pb-3 mb-4 ${className}`}>
      <div className="flex items-start justify-between gap-4 w-full">
        {/* LADO ESQUERDO: Logomarca da Empresa */}
        <div className="flex items-center gap-3 shrink-0">
          {company?.logoUrl ? (
            <div className="w-20 h-20 max-w-[90px] max-h-[90px] rounded-lg border border-stone-200 bg-white flex items-center justify-center p-1 overflow-hidden shadow-2xs">
              <img
                src={company.logoUrl}
                alt={`Logomarca ${tradeName}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-[#0963cb] p-1 shadow-2xs">
              <Building2 className="w-8 h-8 stroke-[1.8]" />
              <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">ERP</span>
            </div>
          )}

          {/* Se houver título específico do relatório, posiciona ao lado ou logo abaixo */}
          {reportTitle && (
            <div className="hidden sm:block">
              <h2 className="text-base font-black text-stone-900 uppercase tracking-tight font-['Outfit']">
                {reportTitle}
              </h2>
              {reportSubtitle && (
                <p className="text-xs text-stone-600 font-medium">
                  {reportSubtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* LADO DIREITO: Nome Fantasia em destaque, CNPJ e Cidade/UF */}
        <div className="text-right flex-1 min-w-0">
          <div className="flex items-center justify-end gap-2 flex-wrap mb-0.5">
            {documentTypeBadge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#0963cb] text-white tracking-wider">
                {documentTypeBadge}
              </span>
            )}
            <h1 className="text-lg sm:text-xl font-black text-[#0963cb] tracking-tight uppercase truncate font-['Outfit']">
              {tradeName}
            </h1>
          </div>

          {corporateName && (
            <p className="text-[11px] text-stone-700 font-semibold truncate">
              Razão Social: {corporateName}
            </p>
          )}

          <div className="text-xs text-stone-600 font-medium space-y-0.5 mt-1">
            <p className="font-bold text-stone-800">
              {cnpj ? `CNPJ: ${cnpj}` : 'CNPJ: Não cadastrado'}
              {cityUf ? ` • ${cityUf}` : ''}
            </p>
            {contact && (
              <p className="text-[11px] text-stone-500">
                {contact}
              </p>
            )}
            {address && (
              <p className="text-[10px] text-stone-400">
                {address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Título do Relatório no mobile / visão estreita se fornecido */}
      {reportTitle && (
        <div className="sm:hidden mt-2 pt-2 border-t border-stone-100">
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-tight">
            {reportTitle}
          </h2>
          {reportSubtitle && (
            <p className="text-xs text-stone-500">
              {reportSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Linha Divisória Horizontal Sutil */}
      {showDivider && (
        <div className="mt-3 w-full border-b-2 border-[#0963cb]/70 print:border-[#0963cb]" />
      )}
    </header>
  );
};
