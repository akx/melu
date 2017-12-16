import './style.css';

import debounce from 'lodash/debounce';
import uniqid from 'lodash/uniqueId';
import m from 'mithril';

import { Types } from './lib/biquad-calc';
import getRandomValue from './lib/get-random-value';
import MeluSynth from './lib/synth';

const ac = new AudioContext();

const SAMPLE_RATE = ac.sampleRate;

function random(a, b) {
  return a + Math.random() * (b - a);
}

function genOsc() {
  const rm = {
    enabled: Math.random() < 0.1,
    type: 'sin',
    id: uniqid(),
    amp: random(0, 1),
    ampMod: random(-0.0003, 0.0003),
    freq: random(50, 500),
    freqMod: 0,
  };
  const fm = {
    enabled: Math.random() < 0.1,
    type: 'sin',
    id: uniqid(),
    amp: random(50, 1000),
    ampMod: 0,
    freq: random(50, 100),
    freqMod: random(-0.01, 0.01),
  };
  const filter = {
    id: uniqid(),
    freq: random(100, 5000),
    freqMod: 0,
    res: random(0.01, 0.8),
    type: getRandomValue(Types),
  };
  return {
    id: uniqid(),
    enabled: true,
    type: 'sin',
    freq: random(100, 1000),
    freqMod: 0,
    amp: random(0.7, 1),
    ampMod: random(-0.00003, 0.00003),
    fm,
    rm,
    filter,
  };
}

const syn = new MeluSynth(SAMPLE_RATE);
syn.oscs.push(genOsc());
let buffer = null;

function rerender() {
  const buf = ac.createBuffer(1, SAMPLE_RATE * 0.7, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  syn.render(data);
  return buf;
}

const debouncedRerender = debounce(() => {
  buffer = rerender();
  m.redraw();
}, 100);

function play(buf) {
  const bs = ac.createBufferSource();
  bs.buffer = buf;
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

function drawData(data) {
  return m(
    'svg',
    { viewBox: '0 0 800 200' },
    m('polyline', {
      fill: 'none',
      stroke: 'black',
      points: mapStep(
        data,
        1,
        (y, i) => `${(i / data.length * 800).toFixed(2)},${Math.round(100 + y * 90)}`,
      ).join(' '),
    }),
  );
}

function numEdit(object, field, min = 0, max = 1) {
  const onchange = (e) => {
    object[field] = e.target.valueAsNumber;
    debouncedRerender();
  };
  const step = Math.abs(max - min) >= 5 ? 0.1 : 0.001;
  return m('div.numed', { key: field }, [
    m('label', field),
    m('input', { type: 'number', min, max, step, value: object[field], onchange }),
    m('input', { type: 'range', min, max, step, value: object[field], onchange }),
  ]);
}

function selectRadios(object, field, options) {
  const radios = Object.keys(options).map(key =>
    m(
      'label',
      m('input', {
        key,
        type: 'radio',
        checked: object[field] === options[key],
        value: options[key],
        onchange: (e) => {
          object[field] = e.target.value;
          debouncedRerender();
        },
      }),
      key,
    ),
  );
  return m('div.ftype', radios);
}

function filterEditor(filter) {
  return m('fieldset', [
    m('legend', 'filter'),
    selectRadios(filter, 'type', Types),
    numEdit(filter, 'freq', 0, 10000),
    numEdit(filter, 'freqMod', -5000, 5000),
    numEdit(filter, 'res', 0, 15),
  ]);
}

function oscEditor(osc, title = 'osc', showEnable = false) {
  console.log(title, osc, osc.enabled);
  const content = osc.enabled
    ? [
        selectRadios(osc, 'type', { sin: 'sin', sqr: 'sqr' }),
        numEdit(osc, 'freq', 0, 10000),
        numEdit(osc, 'freqMod', -100, 100),
        numEdit(osc, 'amp', 0, 1),
        numEdit(osc, 'ampMod', -5, 5),
        osc.fm ? oscEditor(osc.fm, 'fm', true) : null,
        osc.rm ? oscEditor(osc.rm, 'rm', true) : null,
        osc.filter ? filterEditor(osc.filter) : null,
      ]
    : null;
  const enableCheckbox = showEnable
    ? m(
        'label',
        m('input', {
          type: 'checkbox',
          checked: osc.enabled,
          onchange: (e) => {
            osc.enabled = e.target.checked;
            debouncedRerender();
          },
        }),
        'enable',
      )
    : null;

  return m('fieldset', [m('legend', title), enableCheckbox, content]);
}

const view = () =>
  m('main', [
    m('div.s', buffer ? drawData(buffer.getChannelData(0)) : null),
    m(
      'div.c',
      m('div', syn.oscs.map(osc => oscEditor(osc))),
      m('button', { onclick: () => play(buffer) }, 'play'),
    ),
  ]);

buffer = rerender();
play(buffer);
m.mount(document.body, { view });
