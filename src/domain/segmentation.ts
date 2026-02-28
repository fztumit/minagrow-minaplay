export type Segment = 'S1' | 'S2' | 'S3' | 'S4' | 'UNKN';
export type PipelineStage =
  | 'Ön Bilgi Bekleniyor'
  | 'Ürün Netleşiyor'
  | 'Teklif Verilecek';

const UNIT_PRICE = 600;

export type SegmentationInput = {
  qty: number | null;
  productCode: string | null;
};

export type SegmentationOutput = {
  segment: Segment;
  stage: PipelineStage;
  estimatedAmount: number | null;
};

export function resolveSegmentByAmount(amount: number): Segment {
  if (amount < 7500) return 'S1';
  if (amount <= 24999) return 'S2';
  if (amount <= 49999) return 'S3';
  return 'S4';
}

export function segmentLead(input: SegmentationInput): SegmentationOutput {
  const { qty, productCode } = input;

  if (!qty) {
    return {
      segment: 'UNKN',
      stage: 'Ön Bilgi Bekleniyor',
      estimatedAmount: null
    };
  }

  const estimatedAmount = qty * UNIT_PRICE;

  if (!productCode) {
    return {
      segment: resolveSegmentByAmount(estimatedAmount),
      stage: 'Ürün Netleşiyor',
      estimatedAmount
    };
  }

  return {
    segment: resolveSegmentByAmount(estimatedAmount),
    stage: 'Teklif Verilecek',
    estimatedAmount
  };
}
