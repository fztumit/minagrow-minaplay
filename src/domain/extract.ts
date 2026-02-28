export type ExtractionResult = {
  qty: number | null;
  productCode: string | null;
  logoRequested: boolean;
};

const QTY_REGEX = /\b(\d{1,5})\s*(adet|tane)\b/i;
const PRODUCT_CODE_REGEX = /\b\d{4,6}\b/g;

export function extractFromMessage(text: string): ExtractionResult {
  const normalized = text.toLowerCase();

  const qtyMatch = normalized.match(QTY_REGEX);
  const qty = qtyMatch ? Number(qtyMatch[1]) : null;

  const productMatches = text.match(PRODUCT_CODE_REGEX);
  const productCode = productMatches?.[0] ?? null;

  const logoRequested = !normalized.includes('logosuz');

  return {
    qty,
    productCode,
    logoRequested
  };
}
