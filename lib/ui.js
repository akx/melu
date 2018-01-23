import { Types } from './biquad-calc';
import m from 'mithril';
import { genSubOsc, genFilter } from './gen';

export const uiContext = {
  rerender: () => null,
};

export function numEdit(object, field, min = 0, max = 1) {
  const onchange = (e) => {
    object[field] = e.target.valueAsNumber;
    uiContext.rerender();
  };
  const step = Math.abs(max - min) >= 5 ? 0.1 : 0.001;
  const value = object[field] || 0;
  return m('div.numed', { key: field }, [
    m('label', field),
    m('input', { type: 'number', min, max, step, value, onchange }),
    m('input', { type: 'range', min, max, step, value, onchange, oninput: onchange }),
  ]);
}

export function selectRadios(object, field, options) {
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
          uiContext.rerender();
        },
      }),
      key,
    ),
  );
  return m('div.ftype', radios);
}

function wrapInDeleteButton(text, onclick) {
  const deleteButton = m(
    'button',
    {
      onclick: () => {
        onclick();
        uiContext.rerender();
      },
    },
    'delete');
  return m('span', text, ' ', deleteButton);
}

export function filterEditor(filter, onDeleteClick) {
  return m('fieldset', [
    m('legend', wrapInDeleteButton('filter', onDeleteClick)),
    selectRadios(filter, 'type', Types),
    numEdit(filter, 'freq', 0, 10000),
    numEdit(filter, 'freqMod', -5000, 5000),
    numEdit(filter, 'res', 0, 15),
    numEdit(filter, 'resMod', -30, 30),
  ]);
}

export function oscEditor(osc, title = 'osc', showEnable = false, scales = {}) {
  let content = null;
  if (osc.enabled) {
    const fmUiFrag = osc.fm
      ? oscEditor(osc.fm, wrapInDeleteButton('fm', () => Object.assign(osc, { fm: null })), true, { amp: osc.freq })
      : m(
        'button',
        {
          onclick: () => Object.assign(osc, { fm: genSubOsc({}) }),
        },
        'add fm',
      );
    const rmUiFrag = osc.rm
      ? oscEditor(osc.rm, wrapInDeleteButton('rm', () => Object.assign(osc, { rm: null })), true)
      : m(
        'button',
        {
          onclick: () => {
            osc.rm = genSubOsc({});
          },
        },
        'add rm',
      );
    const filterUiFrag = osc.filter
      ? filterEditor(osc.filter, () => Object.assign(osc, { filter: null }))
      : m(
        'button',
        {
          onclick: () => {
            osc.filter = genFilter({});
          },
        },
        'add filter',
      );
    content = [
      selectRadios(osc, 'type', { sin: 'sin', sqr: 'sqr', psqr: 'psqr', saw: 'saw' }),
      m(
        'label',
        m('input', {
          type: 'checkbox',
          checked: !!osc.rectify,
          onchange: (e) => {
            osc.rectify = e.target.checked;
            uiContext.rerender();
          },
        }),
        'rectify',
      ),
      numEdit(osc, 'freq', 0, scales.freq || 10000),
      numEdit(osc, 'phase', 0, 1),
      numEdit(osc, 'freqMod', -(scales.freqMod || 5000), scales.freqMod || 5000),
      numEdit(osc, 'amp', 0, scales.amp || 1),
      numEdit(osc, 'ampMod', -5, 5),
      fmUiFrag,
      rmUiFrag,
      filterUiFrag,
    ];
  }
  const enableCheckbox = showEnable
    ? m(
      'label',
      m('input', {
        type: 'checkbox',
        checked: osc.enabled,
        onchange: (e) => {
          osc.enabled = e.target.checked;
          uiContext.rerender();
        },
      }),
      'enable',
    )
    : null;

  return m('fieldset', [m('legend', title), enableCheckbox, content]);
}

const mapStep = (arr, step, fn) => {
  const out = [];
  for (let i = 0; i < arr.length; i += step) {
    out.push(fn(arr[i], i));
  }
  return out;
};

export function drawData(data) {
  return m(
    'svg',
    { viewBox: '0 0 800 200' },
    m('polyline', {
      fill: 'none',
      stroke: 'black',
      style: {
        strokeWidth: 0.2,
      },
      points: mapStep(
        data,
        1,
        (y, i) => `${(i / data.length * 800).toFixed(2)},${(100 - y * 90).toFixed(2)}`,
      ).join(' '),
    }),
    m('line', {
      stroke: 'purple',
      x1: 0,
      y1: 100,
      x2: 800,
      y2: 100,
    }),
  );
}

export function labeledCheckbox(checked, label, onchange) {
  return m(
    'label',
    m('input', {
      type: 'checkbox',
      checked,
      onchange: e => onchange(e.target.checked),
    }),
    label,
  );
}
