
import './style.css';

import m from 'mithril';

import BiQuad from './lib/biquad';
import { calculate, Types } from './lib/biquad-calc';

const ac = new AudioContext();

const SAMPLE_RATE = ac.sampleRate;

const oscs = [
  {
    // type: 'sqr',
    freq: 490,
    // freqMod: 0.0159,
    amp: 0.8,
    ampMod: -0.00003,
    fm: {
      freq: 250,
      amp: 550,
      // ampMod: 0.01,
      freqMod: 0.01,
    },
    rm: {
      freq: 513,
      amp: 1,
      ampMod: 0,
    },
    xfilter: {
      type: Types.LP,
      freq: 90,
      freqMod: 0.03,
      res: 0.4,
    },
  },
];

function tickFilter(value, filter) {
  if (!filter.freq) return value;

  if (!filter.obj) {
    filter.obj = new BiQuad(SAMPLE_RATE);
  }

  filter.freq += (filter.freqMod || 0);

  const params =
      calculate(filter.type, filter.freq, filter.obj.sampleRate, filter.res, 0);
  filter.obj.setCoefficients(params.a0, params.a1, params.a2, params.b1, params.b2, false);
  return filter.obj.tick(value);
  /*
  filter.pos = filter.pos - (filter.beta * (filter.pos - value));
  if (filter.betaMod) filter.beta += filter.betaMod;
  return filter.pos;
  */
}

function tickOsc(osc) {
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
  const actualFreq = osc.freq + tickOsc(osc.fm);
  osc.pos += actualFreq / SAMPLE_RATE;
  osc.amp += osc.ampMod || 0;
  osc.freq += osc.freqMod || 0;
  if (osc.rm) value *= tickOsc(osc.rm);
  if (osc.filter) value = tickFilter(value, osc.filter);
  return value;
}

function render() {
  let value = 0;
  oscs.forEach((osc) => {
    value += tickOsc(osc);
  });
  return Math.max(-1, Math.min(1, value));
}

const length = 1;
const nFrames = Math.ceil(length * SAMPLE_RATE);
const buffer = ac.createBuffer(1, nFrames, SAMPLE_RATE);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) {
  data[i] = render();
}

function play(buffer) {
  const bs = ac.createBufferSource();
  bs.buffer = buffer;
  bs.loop = false;
  bs.connect(ac.destination);
  bs.start();
}

const mapStep = (arr, step, fn) => {
  const out = [];
  for (let i = 0; i < arr.length; i += step) {
    out.push(fn(arr[i], i));
  }
  return out;
};

const view = () =>
  m('svg', { viewBox: '0 0 800 200' }, m('polyline', {
    fill: 'none',
    stroke: 'black',
    points: mapStep(
      data, 1,
      (y, i) => `${(i / data.length * 800).toFixed(2)},${
        Math.round(100 + y * 90)}`
)
      .join(' '),
  }));

m.mount(document.body, { view });
play(buffer);
