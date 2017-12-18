import './style.css';

import debounce from 'lodash/debounce';
import m from 'mithril';

import { genOsc } from './lib/gen';
import { oscEditor, uiContext, drawData, labeledCheckbox } from './lib/ui';
import MeluSynth from './lib/synth';

const ac = new AudioContext();

const SAMPLE_RATE = ac.sampleRate;

const syn = new MeluSynth(SAMPLE_RATE);
syn.oscs.push(genOsc());
let buffer = null;
const lengthSec = 1;
let normalize = true;
let autoPlay = false;
let lastSource = null;

function normalizeBuffer(data) {
  let maxAmp = null;
  for (let i = 0; i < data.length; i++) {
    const val = Math.abs(data[i]);
    maxAmp = maxAmp === null ? val : Math.max(maxAmp, Math.abs(data[i]));
  }
  for (let i = 0; i < data.length; i++) {
    data[i] /= maxAmp;
  }
}

function play(buf) {
  if (lastSource) {
    lastSource.stop();
  }
  const bs = ac.createBufferSource();
  bs.buffer = buf;
  bs.loop = false;
  bs.connect(ac.destination);
  bs.start();
  lastSource = bs;
}

function rerender() {
  const buf = ac.createBuffer(1, SAMPLE_RATE * lengthSec, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  syn.render(data);
  if (normalize) normalizeBuffer(data);
  return buf;
}

const debouncedRerender = debounce(() => {
  buffer = rerender();
  if (autoPlay) {
    play(buffer);
  }
  m.redraw();
}, 30);
uiContext.rerender = debouncedRerender;

const view = () =>
  m('main', [
    m('div.s', buffer ? drawData(buffer.getChannelData(0)) : null),
    m(
      'div.c',
      m('div', syn.oscs.map(osc => oscEditor(osc))),
      m('button', { onclick: () => play(buffer) }, 'play'),
      labeledCheckbox(autoPlay, 'autoplay', (flag) => {
        autoPlay = flag;
      }),
      labeledCheckbox(normalize, 'normalize', (flag) => {
        normalize = flag;
        debouncedRerender();
      }),
    ),
  ]);

buffer = rerender();
m.mount(document.body, { view });
