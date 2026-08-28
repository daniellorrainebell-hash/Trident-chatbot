/**
 * Barcode normalisation and validation (Feed spec §22).
 *
 * Runs entirely on-device with no AI and no network. Getting this right
 * matters more than it looks: a mis-normalised GTIN silently misses the cache
 * and burns a provider call, and a bad check digit means the scan picked up
 * noise or a non-food code.
 */

export type BarcodeType = 'ean13' | 'ean8' | 'upca' | 'upce' | 'code128' | 'unknown';

/**
 * The symbologies the camera is configured to read. UK retail is mostly EAN-13.
 *
 * Code 128 is deliberately absent. It is a variable-length symbology used for
 * logistics labels, not consumer packaging, so `isPlausibleProductBarcode`
 * rejects every one of them. Leaving it switched on only bought a buzz, a
 * locked camera and a failure screen for a shelf-edge label.
 */
export const SUPPORTED_BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export type NormalisedBarcode = {
  /** Exactly what the scanner returned, preserved for support and audit. */
  raw: string;
  /** Digits only, padded to GTIN-13 where the symbology allows it. */
  gtin: string;
  type: BarcodeType;
  validCheckDigit: boolean;
};

export function digitsOnly(value: string): string {
  return value.trim().replace(/\D/g, '');
}

/**
 * GTIN check digit: weight digits 3-1-3-1 from the right of the payload, sum,
 * then take the difference to the next multiple of ten.
 */
export function calculateCheckDigit(payload: string): number {
  let sum = 0;
  // Rightmost payload digit carries weight 3, alternating leftward.
  for (let i = payload.length - 1, weight = 3; i >= 0; i -= 1, weight = weight === 3 ? 1 : 3) {
    sum += Number(payload[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

export function hasValidCheckDigit(code: string): boolean {
  if (code.length < 8) return false;
  const payload = code.slice(0, -1);
  const check = Number(code.slice(-1));
  return calculateCheckDigit(payload) === check;
}

/**
 * Expand a compressed UPC-E to its UPC-A form.
 *
 * UPC-E squeezes a 12-digit code into 8 by dropping runs of zeros, and the
 * final digit of the payload says how to put them back. Without this a UPC-E
 * scan never matches a cached UPC-A product.
 */
export function expandUpcE(upce: string): string | null {
  const code = digitsOnly(upce);
  if (code.length !== 8) return null;

  const numberSystem = code[0]!;
  if (numberSystem !== '0' && numberSystem !== '1') return null;

  const body = code.slice(1, 7);
  const check = code[7]!;
  const d = body.split('');
  const lastDigit = Number(d[5]);

  let middle: string;
  switch (lastDigit) {
    case 0: case 1: case 2:
      middle = `${d[0]}${d[1]}${lastDigit}0000${d[2]}${d[3]}${d[4]}`;
      break;
    case 3:
      middle = `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
      break;
    case 4:
      middle = `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
      break;
    default:
      middle = `${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${lastDigit}`;
      break;
  }

  return `${numberSystem}${middle}${check}`;
}

/**
 * Normalise any scanned code to a comparable GTIN-13.
 *
 * UPC-A is a GTIN-13 with a leading zero, and EAN-8 is padded to 13 the same
 * way. Treating them as different strings is how the same product appears
 * twice in a cache.
 */
export function normaliseBarcode(raw: string, reportedType?: string): NormalisedBarcode {
  const code = digitsOnly(raw);

  let gtin = code;
  let type: BarcodeType = 'unknown';
  /**
   * The string the check digit is actually defined over.
   *
   * For most symbologies that is the code as scanned. UPC-E is the exception:
   * its last digit is the check digit of the *expanded* UPC-A, not of the
   * compressed eight. Validating the compressed form rejects 42% of genuine
   * UPC-E codes before they ever reach a lookup.
   */
  let checkAgainst = code;

  if (code.length === 13) {
    type = 'ean13';
  } else if (code.length === 12) {
    type = 'upca';
    gtin = `0${code}`;
  } else if (code.length === 8) {
    const expanded = reportedType?.includes('upc_e') ? expandUpcE(code) : null;
    if (expanded) {
      type = 'upce';
      gtin = `0${expanded}`;
      checkAgainst = expanded;
    } else {
      type = 'ean8';
      gtin = code.padStart(13, '0');
    }
  } else if (code.length === 14) {
    // A GTIN-14 is a case or carton: an indicator digit, the consumer unit's
    // twelve-digit body, then its own check digit. Dropping the indicator
    // leaves the *case* check digit on the end, which only happens to be right
    // when the indicator is 0 — for every other pallet configuration it yields
    // a GTIN that does not exist. Recompute it from the body instead.
    type = 'ean13';
    const body = code.slice(1, 13);
    gtin = `${body}${calculateCheckDigit(body)}`;
  } else if (reportedType?.includes('code128')) {
    type = 'code128';
  }

  return { raw, gtin, type, validCheckDigit: hasValidCheckDigit(checkAgainst) };
}

/**
 * Is this plausibly a food product barcode?
 *
 * A QR code on a poster is not a product, and neither is a loyalty card.
 * Rejecting early is better than a provider round-trip that returns nothing.
 */
export function isPlausibleProductBarcode(result: NormalisedBarcode): boolean {
  const length = digitsOnly(result.raw).length;
  if (![8, 12, 13, 14].includes(length)) return false;
  return result.validCheckDigit;
}

/** Scanner state machine. The camera fires repeatedly; one result is enough. */
export type ScanState = 'ready' | 'resolving' | 'resolved' | 'error';

export function shouldAcceptScan(state: ScanState): boolean {
  return state === 'ready';
}
