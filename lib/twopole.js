const TWO_PI = Math.PI * 2;

// Ported from STK, the Synthesis ToolKit.

export default class TwoPole {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.gain = 1;
    this.reset();
  }
  reset() {
    this.a = new Float32Array(3);
    this.b = new Float32Array(1);
    this.inputs = new Float32Array(1);
    this.outputs = new Float32Array(3);
    this.lastFrame = new Float32Array(1);
  }
  setParameters(frequency, radius, normalize = true) {
    this.a[2] = radius * radius;
    this.a[1] = -2.0 * radius * Math.cos(TWO_PI * frequency / this.sampleRate);

    if (normalize) {
      // Normalize the filter gain ... not terribly efficient.
      const real = 1 - radius +
          (this.a[2] - radius) *
              Math.cos(TWO_PI * 2 * frequency / this.sampleRate);
      const imag = (this.a[2] - radius) *
          Math.sin(TWO_PI * 2 * frequency / this.sampleRate);
      this.b[0] = Math.sqrt(Math.pow(real, 2) + Math.pow(imag, 2));
    }
  }
  tick(input) {
    this.inputs[0] = this.gain * input;
    this.lastFrame[0] = (this.b[0] * this.inputs[0]) -
        (this.a[1] * this.outputs[1]) - (this.a[2] * this.outputs[2]);
    this.outputs[2] = this.outputs[1];
    this.outputs[1] = this.lastFrame[0];
    return this.lastFrame[0];
  }
}