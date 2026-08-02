// Runs entirely in the browser using the Web Crypto API's CSPRNG
// (crypto.getRandomValues) — never Math.random(), and a generated password
// is never sent anywhere.

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = /[il1LoO0]/;

/**
 * @param {object} opts
 * @param {number} opts.length
 * @param {boolean} opts.lower
 * @param {boolean} opts.upper
 * @param {boolean} opts.digits
 * @param {boolean} opts.symbols
 * @param {boolean} opts.excludeAmbiguous
 * @returns {string}
 */
export function generatePassword(opts = {}) {
  const {
    length = 16,
    lower = true,
    upper = true,
    digits = true,
    symbols = true,
    excludeAmbiguous = false,
  } = opts;

  let pool = '';
  if (lower) pool += LOWER;
  if (upper) pool += UPPER;
  if (digits) pool += DIGITS;
  if (symbols) pool += SYMBOLS;
  if (!pool) throw new Error('no_character_set_selected');

  if (excludeAmbiguous) pool = pool.split('').filter((c) => !AMBIGUOUS.test(c)).join('');

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let out = '';
  for (let i = 0; i < length; i++) {
    out += pool[randomValues[i] % pool.length];
  }
  return out;
}

/**
 * Rough entropy estimate in bits, used only to drive the strength meter's
 * label & color — not a formal cryptographic guarantee.
 * @param {string} password
 * @returns {{ bits: number, label: 'weak'|'fair'|'strong'|'very_strong' }}
 */
export function estimateStrength(password) {
  if (!password) return { bits: 0, label: 'weak' };

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const bits = Math.round(password.length * Math.log2(poolSize || 1));

  let label = 'weak';
  if (bits >= 100) label = 'very_strong';
  else if (bits >= 70) label = 'strong';
  else if (bits >= 45) label = 'fair';

  return { bits, label };
}
