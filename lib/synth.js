import BiQuad from './biquad';
import { calculate, Types } from './biquad-calc';

function tickFilter(ctx, filter, value) {
  if (!(filter && filter.freq && filter.type)) return value;
  if (filter.type === Types.BYPASS) return value;
  let filterObj = ctx.state[filter.id];
  if (!filterObj) {
    filterObj = new BiQuad(ctx.sampleRate);
    ctx.state[filter.id] = filterObj;
  }

  const actualFreq = Math.max(0, filter.freq + ctx.time * (filter.freqMod || 0));
  const actualRes = Math.max(0, filter.res + ctx.time * (filter.resMOd || 0));

  const params = calculate(filter.type, actualFreq, ctx.sampleRate, actualRes, 0);
  filterObj.setCoefficients(params.a0, params.a1, params.a2, params.b1, params.b2, false);
  return filterObj.tick(value);
}

function tickOsc(ctx, osc) {
  if (!osc) return 0;
  const actualAmp = osc.amp + ctx.time * (osc.ampMod || 0);
  if (actualAmp <= 0) return 0;
  const actualFreq =
    osc.freq +
    ctx.time * (osc.freqMod || 0) +
    (osc.fm && osc.fm.enabled ? tickOsc(ctx, osc.fm) : 0);
  let oscPos = ctx.state[osc.id] || osc.phase || 0;
  let value = 0;
  switch (osc.type) {
    case 'sqr':
      value = oscPos % 1 < 0.5 ? -1 : 1;
      break;
    case 'psqr':
      value = oscPos % 1 < 0.5 ? 0 : 1;
      break;
    case 'saw':
      value = (oscPos % 1 - 0.5) * 2;
      break;
    default:
      value = Math.sin(oscPos * Math.PI * 2) * osc.amp;
      break;
  }
  if (osc.rectify) value = Math.abs(value);
  oscPos += actualFreq / ctx.sampleRate;
  ctx.state[osc.id] = oscPos;
  if (osc.rm && osc.rm.enabled) value *= tickOsc(ctx, osc.rm);
  if (osc.filter) value = tickFilter(ctx, osc.filter, value);
  value *= actualAmp;
  return value;
}

export default class MeluSynth {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.oscs = [];
  }

  renderTick(state, i) {
    let value = 0;
    const context = {
      sampleRate: this.sampleRate,
      sample: i,
      time: i / this.sampleRate,
      state,
    };
    this.oscs.forEach((osc) => {
      value += tickOsc(context, osc);
    });
    return value;
  }

  render(data) {
    const state = {};
    for (let i = 0; i < data.length; i++) {
      data[i] = this.renderTick(state, i);
    }
    return data;
  }
}
