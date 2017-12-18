import uniqid from 'lodash/uniqueId';
import { Types } from './biquad-calc';
import { pickValueFromObject, random } from './random';

export function genSubOsc(into, props) {
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

export function genFilter(into, props) {
  return Object.assign(
    into,
    {
      id: uniqid(),
      freq: Math.floor(random(100, 5000)),
      freqMod: 0,
      res: random(0.01, 0.8),
      resMod: 0,
      type: pickValueFromObject(Types),
    },
    props,
  );
}

export function genOsc(into = {}) {
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
