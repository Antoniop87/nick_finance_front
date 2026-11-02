type CsvCell = string | number;

/**
 * Gera e baixa um CSV compatível com o Excel em português
 * (separador `;` e BOM para manter os acentos).
 */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCell(cell: CsvCell): string {
  const text = String(cell);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
