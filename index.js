import './style.css';

import m from 'mithril';
import TwoPole from './lib/twopole';

const ac = new AudioContext();

const SAMPLE_RATE = ac.sampleRate;

const oscs = [
  {
    freq: 440,
    freqMod: -.0019,
    pos: 0,
    amp: 1,
    ampMod: -0.00003,
    fm: {
      freq: 250,
      pos: 0,
      amp: 100,
      ampMod: 0.001,
    },
    rm: {
      freq: 101,
      pos: 0,
      amp: 1,
      ampMod: 0,
    },
    filter: {
      twopole: null,
      freq: 80,
      res: 0,
    },
  },
];

function tickFilter(value, filter) {
  if (!filter.freq) return value;
  if (!filter.twopole) {
    filter.twopole = new TwoPole(SAMPLE_RATE);
    filter.twopole.setParameters(filter.freq, filter.res, true);
  }
  return filter.twopole.tick(value);
  /*
  filter.pos = filter.pos - (filter.beta * (filter.pos - value));
  if (filter.betaMod) filter.beta += filter.betaMod;
  return filter.pos;
  */
}

function tickOsc(osc) {
  if (!osc) return 0;
  if (osc.amp <= 0) return 0;
  let value = Math.sin(osc.pos * Math.PI * 2) * osc.amp;
  let actualFreq = osc.freq + tickOsc(osc.fm);
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

const buffer = ac.createBuffer(1, SAMPLE_RATE, SAMPLE_RATE);
const data = buffer.getChannelData(0);
for (var i = 0; i < data.length; i++) {
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
  for (var i = 0; i < arr.length; i += step) {
    out.push(fn(arr[i], i));
  }
  return out;
};

const view = () => {
  return m('svg', {viewBox: '0 0 800 200'}, m('polyline', {
             fill: 'none',
             stroke: 'black',
             points: mapStep(
                         data, 1,
                         (y, i) => `${(i / data.length * 800).toFixed(2)},${
                             Math.round(100 + y * 90)}`)
                         .join(' '),
           }))
};

m.mount(document.body, {view});
play(buffer);