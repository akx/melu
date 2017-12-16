/* eslint-disable prefer-destructuring */
export default class BiQuad { // Ported from STK, the Synthesis ToolKit.
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.gain = 1;
    this.reset();
    this.clear();
  }
  reset() {
    this.a0 = 1;
    this.a1 = 0;
    this.a2 = 0;
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.inputs = new Float32Array(3);
    this.outputs = new Float32Array(3);
    this.lastFrame = 0;
  }
  clear() {
    this.inputs.fill(0);
    this.outputs.fill(0);
    this.lastFrame = 0;
  }
  setCoefficients(b0, b1, b2, a1, a2, clearState = false) {
    this.a0 = 1;
    this.a1 = a1;
    this.a2 = a2;
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    if (clearState) {
      this.clear();
    }
  }

  tick(input) {
    this.inputs[0] = this.gain * input;
    this.lastFrame = ((this.b0 * this.inputs[0]) + (this.b1 * this.inputs[1]) +
                      (this.b2 * this.inputs[2])) -
        ((this.a2 * this.outputs[2]) + (this.a1 * this.outputs[1]));
    this.inputs[2] = this.inputs[1];
    this.inputs[1] = this.inputs[0];
    this.outputs[2] = this.outputs[1];
    this.outputs[1] = this.lastFrame;
    return this.lastFrame;
  }
}
