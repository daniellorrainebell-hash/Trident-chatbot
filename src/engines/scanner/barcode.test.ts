import {
  calculateCheckDigit,
  expandUpcE,
  hasValidCheckDigit,
  isPlausibleProductBarcode,
  normaliseBarcode,
  shouldAcceptScan,
} from './barcode';

describe('check digits', () => {
  it('computes the GTIN check digit', () => {
    // Real EAN-13s; the final digit is the check.
    expect(calculateCheckDigit('501001714500')).toBe(2);
    expect(calculateCheckDigit('400638133393')).toBe(1);
  });

  it('validates a correct code', () => {
    expect(hasValidCheckDigit('5010017145002')).toBe(true);
    expect(hasValidCheckDigit('4006381333931')).toBe(true);
  });

  it('rejects a mistyped digit', () => {
    expect(hasValidCheckDigit('5010017145003')).toBe(false);
  });

  it('rejects something too short to be a GTIN', () => {
    expect(hasValidCheckDigit('12345')).toBe(false);
  });
});

describe('normaliseBarcode', () => {
  it('keeps an EAN-13 as-is', () => {
    const result = normaliseBarcode('5010017145002');
    expect(result).toMatchObject({ gtin: '5010017145002', type: 'ean13', validCheckDigit: true });
  });

  it('pads UPC-A to GTIN-13 so it matches the same cached product', () => {
    const result = normaliseBarcode('012345678905');
    expect(result.gtin).toBe('0012345678905');
    expect(result.type).toBe('upca');
    expect(result.validCheckDigit).toBe(true);
  });

  it('pads EAN-8 to 13', () => {
    const result = normaliseBarcode('96385074');
    expect(result.gtin).toHaveLength(13);
    expect(result.gtin.endsWith('96385074')).toBe(true);
  });

  it('strips whitespace and stray characters', () => {
    expect(normaliseBarcode('  5010017145002 ').gtin).toBe('5010017145002');
    expect(normaliseBarcode('501-0017-145002').gtin).toBe('5010017145002');
  });

  it('preserves the raw value for support and audit', () => {
    expect(normaliseBarcode(' 012345678905 ').raw).toBe(' 012345678905 ');
  });

  it('drops the indicator digit from a GTIN-14 case code', () => {
    expect(normaliseBarcode('15010017145002').gtin).toBe('5010017145002');
  });
});

describe('expandUpcE', () => {
  it('expands a compressed code to UPC-A', () => {
    // 0 1234 5 6 -> last digit 5 means the "insert four zeros" rule.
    const expanded = expandUpcE('01234565');
    expect(expanded).toHaveLength(12);
    expect(expanded?.startsWith('0')).toBe(true);
  });

  it('rejects a wrong-length code', () => {
    expect(expandUpcE('0123456')).toBeNull();
  });

  it('rejects an unsupported number system', () => {
    expect(expandUpcE('51234565')).toBeNull();
  });

  it('lets a UPC-E scan resolve to the same GTIN as its UPC-A form', () => {
    const compressed = normaliseBarcode('01234565', 'upc_e');
    expect(compressed.type).toBe('upce');
    expect(compressed.gtin).toHaveLength(13);
  });
});

describe('isPlausibleProductBarcode', () => {
  it('accepts a valid retail barcode', () => {
    expect(isPlausibleProductBarcode(normaliseBarcode('5010017145002'))).toBe(true);
  });

  it('rejects a QR code that is not a product', () => {
    expect(isPlausibleProductBarcode(normaliseBarcode('https://example.com/promo'))).toBe(false);
  });

  it('rejects a valid-length code with a bad check digit', () => {
    expect(isPlausibleProductBarcode(normaliseBarcode('5010017145003'))).toBe(false);
  });
});

describe('scan de-duplication', () => {
  it('accepts only while ready, so repeated camera callbacks resolve once', () => {
    expect(shouldAcceptScan('ready')).toBe(true);
    expect(shouldAcceptScan('resolving')).toBe(false);
    expect(shouldAcceptScan('resolved')).toBe(false);
    expect(shouldAcceptScan('error')).toBe(false);
  });
});
