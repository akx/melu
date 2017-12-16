
import BiQuad from './biquad';
import { calculate } from './biquad-calc';

function tickFilter(ctx, filter, value) {
  if (!filter.freq) return value;

  if (!filter.obj) {
    filter.obj = new BiQuad(ctx.sampleRate);
  }

  filter.freq += (filter.freqMod || 0);

  const params =
      calculate(filter.type, filter.freq, filter.obj.sampleRate, filter.res, 0);
  filter.obj.setCoefficients(params.a0, params.a1, params.a2, params.b1, params.b2, false);
  return filter.obj.tick(value);
}

function tickOsc(ctx, osc) {
  if (!osc) return 0;
  if (osc.amp <= 0) return 0;
  if (!osc.pos) osc.pos = 0;
  let value = 0;
  switch (osc.type) {
    case 'sqr':
      value = (osc.pos % 1) < 0.5 ? -1 : 1;
      break;
    default:
      value = Math.sin(osc.pos * Math.PI * 2) * osc.amp;
      break;
  }
  const actualFreq = osc.freq + tickOsc(ctx, osc.fm);
  osc.pos += actualFreq / ctx.sampleRate;
  osc.amp += osc.ampMod || 0;
  osc.freq += osc.freqMod || 0;
  if (osc.rm) value *= tickOsc(ctx, osc.rm);
  if (osc.filter) value = tickFilter(ctx, osc.filter, value);
  return value;
}

export default class MeluSynth {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.oscs = [];
  }

  renderTick(i) {
    let value = 0;
    const context = {
      sampleRate: this.sampleRate,
      sample: i,
      time: i / this.sampleRate,
    };
    this.oscs.forEach((osc) => {
      value += tickOsc(context, osc);
    });
    return Math.max(-1, Math.min(1, value));
  }

  render(data) {
    for (let i = 0; i < data.length; i++) {
      data[i] = this.renderTick(i);
    }
    return data;
  }
}
