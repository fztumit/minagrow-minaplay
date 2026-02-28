import { describe, expect, it } from 'vitest';
import { segmentLead } from '../src/domain/segmentation';

describe('segmentLead', () => {
  it('adet yoksa UNKN ve On Bilgi Bekleniyor dondurur', () => {
    const result = segmentLead({ qty: null, productCode: null });
    expect(result.segment).toBe('UNKN');
    expect(result.stage).toBe('Ön Bilgi Bekleniyor');
    expect(result.estimatedAmount).toBeNull();
  });

  it('adet var urun kodu yoksa Urun Netlesiyor olur', () => {
    const result = segmentLead({ qty: 10, productCode: null });
    expect(result.segment).toBe('S1');
    expect(result.stage).toBe('Ürün Netleşiyor');
    expect(result.estimatedAmount).toBe(6000);
  });

  it('adet ve urun kodu varsa Teklif Verilecek olur', () => {
    const result = segmentLead({ qty: 50, productCode: '10516' });
    expect(result.segment).toBe('S3');
    expect(result.stage).toBe('Teklif Verilecek');
    expect(result.estimatedAmount).toBe(30000);
  });
});
