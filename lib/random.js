export function pickValueFromObject(obj) {
  const keys = Object.keys(obj);
  const index = Math.floor(Math.random() * keys.length);
  return obj[keys[index]];
}

export function random(a, b) {
  return a + Math.random() * (b - a);
}
