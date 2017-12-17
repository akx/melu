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

function genSubOsc(into, props) {
  return Object.assign(
    into,
    {
      enabled: true,
      type: 'sin',
      id: uniqid(),
      amp: random(0, 1),
      ampMod: random(-0.0003, 0.0003),
      freq: Math.floor(random(50, 500)),
      freqMod: random(-0.1, 0.1),
    },
    props,
  );
}

function genFilter(into, props) {
  return Object.assign(
    into,
    {
      id: uniqid(),
      freq: Math.floor(random(100, 5000)),
      freqMod: 0,
      res: random(0.01, 0.8),
      resMod: 0,
      type: getRandomValue(Types),
    },
    props,
  );
}

function genOsc(into = {}) {
  const freq = Math.floor(random(100, 1000));
  const rm = genSubOsc(
    {},
    {
      enabled: Math.random() < 0.1,
    },
  );
  const fm = genSubOsc(
    {},
    {
      enabled: Math.random() < 0.1,
      amp: Math.floor(random(50, freq / 2)),
    },
  );
  const filter = genFilter({});
  return Object.assign(into, {
    id: uniqid(),
    enabled: true,
    type: 'sin',
    freq,
    freqMod: 0,
    amp: 1,
    ampMod: random(-0.1, 0.1),
    fm,
    rm,
    filter,
  });
}

const syn = new MeluSynth(SAMPLE_RATE);
syn.oscs.push(genOsc());
let buffer = null;

function rerender() {
  const buf = ac.createBuffer(1, SAMPLE_RATE * 0.7, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  syn.render(data);
  let maxAmp = null;
  for (let i = 0; i < data.length; i++) {
    const val = Math.abs(data[i]);
    maxAmp = maxAmp === null ? val : Math.max(maxAmp, Math.abs(data[i]));
  }
  for (let i = 0; i < data.length; i++) {
    data[i] /= maxAmp;
  }
  return buf;
}

const debouncedRerender = debounce(() => {
  buffer = rerender();
  m.redraw();
}, 30);

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
        (y, i) => `${(i / data.length * 800).toFixed(2)},${Math.round(100 - y * 90)}`,
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
  const value = object[field] || 0;
  return m('div.numed', { key: field }, [
    m('label', field),
    m('input', { type: 'number', min, max, step, value, onchange }),
    m('input', { type: 'range', min, max, step, value, onchange, oninput: onchange }),
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
    numEdit(filter, 'resMod', -30, 30),
  ]);
}

function oscEditor(osc, title = 'osc', showEnable = false) {
  const content = osc.enabled
    ? [
        selectRadios(osc, 'type', { sin: 'sin', sqr: 'sqr', psqr: 'psqr', saw: 'saw' }),
        m(
          'label',
          m('input', {
            type: 'checkbox',
            checked: !!osc.rectify,
            onchange: (e) => {
              osc.rectify = e.target.checked;
              debouncedRerender();
            },
          }),
          'rectify',
        ),
        numEdit(osc, 'freq', 0, 10000),
        numEdit(osc, 'phase', 0, 1),
        numEdit(osc, 'freqMod', -100, 100),
        numEdit(osc, 'amp', 0, 1),
        numEdit(osc, 'ampMod', -5, 5),
        osc.fm
          ? oscEditor(osc.fm, 'fm', true)
          : m(
              'button',
              {
                onclick: () => {
                  osc.fm = genSubOsc();
                },
              },
              'add fm',
            ),
        osc.rm
          ? oscEditor(osc.rm, 'rm', true)
          : m(
              'button',
              {
                onclick: () => {
                  osc.rm = genSubOsc();
                },
              },
              'add rm',
            ),
        osc.filter
          ? filterEditor(osc.filter)
          : m(
              'button',
              {
                onclick: () => {
                  osc.filter = genFilter();
                },
              },
              'add filter',
            ),
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
m.mount(document.body, { view });
