
import './style.css';

import m from 'mithril';

import { Types } from './lib/biquad-calc';
import getRandomValue from './lib/get-random-value';
import MeluSynth from './lib/synth';

const ac = new AudioContext();

const SAMPLE_RATE = ac.sampleRate;

function random(a, b) {
  return a + (Math.random() * (b - a));
}

function genOsc() {
  const rm =
      (Math.random() < 0.1 ? {
        freq: random(50, 500),
        amp: random(0, 1),
        ampMod: random(-0.0003, 0.0003),
      } :
        null);
  const fm =
      (Math.random() < 0.1 ? {
        freq: random(50, 100),
        amp: random(50, 1000),
        // ampMod: 0.01,
        freqMod: random(-0.01, 0.01),
      } :
        null);
  const filter =
      (Math.random() < 0.7 ? {
        type: getRandomValue(Types),
        freq: random(100, 5000),
        freqMod: 0.03,
        res: random(0.01, 0.8),
      } :
        null);
  return {
    // type: 'sqr',
    freq: random(100, 1000),
    // freqMod: 0.0159,
    amp: random(0.7, 1),
    ampMod: random(-0.00003, 0.00003),
    fm,
    rm,
    filter,
  };
}

const syn = new MeluSynth(SAMPLE_RATE);
syn.oscs.push(genOsc());
const buffer = ac.createBuffer(1, SAMPLE_RATE * 0.7, SAMPLE_RATE);
const data = buffer.getChannelData(0);
syn.render(data);

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
