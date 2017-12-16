export default function getRandomValue(obj) {
  const keys = Object.keys(obj);
  const index = Math.floor(Math.random() * keys.length);
  return obj[keys[index]];
}
