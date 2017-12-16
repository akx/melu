/* eslint-disable no-restricted-properties, no-mixed-operators, no-multi-assign
 */
// http://www.earlevel.com/main/2013/10/13/biquad-calculator-v2/

export const Types = {
  BYPASS: 'bypass',
  LP1P: 'lp1p',
  HP1P: 'hp1p',
  LOWPASS: 'lowpass',
  HIGHPASS: 'highpass',
  BANDPASS: 'bandpass',
  NOTCH: 'notch',
  PEAK: 'peak',
  LOWSHELF: 'lowshelf',
  HIGHSHELF: 'highshelf',
};

export function calculate(type, Fc, Fs, Q, peakGain) {
  let a0;
  let a1;
  let a2;
  let b1;
  let b2;
  let norm;

  const V = Math.pow(10, Math.abs(peakGain) / 20);
  const K = Math.tan(Math.PI * (Fc / Fs));
  switch (type) {
    case Types.LP1P:
      b1 = Math.exp(-2.0 * Math.PI * (Fc / Fs));
      a0 = 1.0 - b1;
      b1 = -b1;
      a1 = a2 = b2 = 0;
      break;

    case Types.HP1P:
      b1 = -Math.exp(-2.0 * Math.PI * (0.5 - Fc / Fs));
      a0 = 1.0 + b1;
      b1 = -b1;
      a1 = a2 = b2 = 0;
      break;

    case Types.LOWPASS:
      norm = 1 / (1 + K / Q + K * K);
      a0 = K * K * norm;
      a1 = 2 * a0;
      a2 = a0;
      b1 = 2 * (K * K - 1) * norm;
      b2 = (1 - K / Q + K * K) * norm;
      break;

    case Types.HIGHPASS:
      norm = 1 / (1 + K / Q + K * K);
      a0 = 1 * norm;
      a1 = -2 * a0;
      a2 = a0;
      b1 = 2 * (K * K - 1) * norm;
      b2 = (1 - K / Q + K * K) * norm;
      break;

    case Types.BANDPASS:
      norm = 1 / (1 + K / Q + K * K);
      a0 = K / Q * norm;
      a1 = 0;
      a2 = -a0;
      b1 = 2 * (K * K - 1) * norm;
      b2 = (1 - K / Q + K * K) * norm;
      break;

    case Types.NOTCH:
      norm = 1 / (1 + K / Q + K * K);
      a0 = (1 + K * K) * norm;
      a1 = 2 * (K * K - 1) * norm;
      a2 = a0;
      b1 = a1;
      b2 = (1 - K / Q + K * K) * norm;
      break;

    case Types.PEAK:
      if (peakGain >= 0) {
        norm = 1 / (1 + 1 / Q * K + K * K);
        a0 = (1 + V / Q * K + K * K) * norm;
        a1 = 2 * (K * K - 1) * norm;
        a2 = (1 - V / Q * K + K * K) * norm;
        b1 = a1;
        b2 = (1 - 1 / Q * K + K * K) * norm;
      } else {
        norm = 1 / (1 + V / Q * K + K * K);
        a0 = (1 + 1 / Q * K + K * K) * norm;
        a1 = 2 * (K * K - 1) * norm;
        a2 = (1 - 1 / Q * K + K * K) * norm;
        b1 = a1;
        b2 = (1 - V / Q * K + K * K) * norm;
      }
      break;
    case Types.LOWSHELF:
      if (peakGain >= 0) {
        norm = 1 / (1 + Math.SQRT2 * K + K * K);
        a0 = (1 + Math.sqrt(2 * V) * K + V * K * K) * norm;
        a1 = 2 * (V * K * K - 1) * norm;
        a2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
        b1 = 2 * (K * K - 1) * norm;
        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
      } else {
        norm = 1 / (1 + Math.sqrt(2 * V) * K + V * K * K);
        a0 = (1 + Math.SQRT2 * K + K * K) * norm;
        a1 = 2 * (K * K - 1) * norm;
        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
        b1 = 2 * (V * K * K - 1) * norm;
        b2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
      }
      break;
    case Types.HIGHSHELF:
      if (peakGain >= 0) {
        norm = 1 / (1 + Math.SQRT2 * K + K * K);
        a0 = (V + Math.sqrt(2 * V) * K + K * K) * norm;
        a1 = 2 * (K * K - V) * norm;
        a2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
        b1 = 2 * (K * K - 1) * norm;
        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
      } else {
        norm = 1 / (V + Math.sqrt(2 * V) * K + K * K);
        a0 = (1 + Math.SQRT2 * K + K * K) * norm;
        a1 = 2 * (K * K - 1) * norm;
        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
        b1 = 2 * (K * K - V) * norm;
        b2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
      }
      break;
    case Types.BYPASS:
      break;
    default:
      throw new Error(`what is this type ${type}`);
  }
  return { a0, a1, a2, b1, b2 };
}
