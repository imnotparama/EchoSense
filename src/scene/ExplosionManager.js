import * as TWEEN from '@tweenjs/tween.js';

export class ExplosionManager {
  constructor(components) {
    this.components = components;
    this.isExploded = false;
    this.currentFactor = 0;

    // Component explosion vertical lift offsets (in cm)
    this.offsets = [
      { comp: components.oled, liftY: 3.5 },
      { comp: components.inmp441, liftY: 2.8 },
      { comp: components.esp32, liftY: 2.2 },
      { comp: components.rgbLed, liftY: 2.5 },
      { comp: components.capacitors, liftY: 1.8 },
      { comp: components.transCircuit, liftY: 1.8 },
      { comp: components.buzzer, liftY: 1.6 },
      { comp: components.vibeMotor, liftY: 1.6 },
      { comp: components.pushButtons, liftY: 1.2 },
      { comp: components.breadboard, liftY: -0.8 }
    ];

    // Cache default initial Y positions
    this.offsets.forEach(item => {
      if (item.comp && item.comp.group) {
        item.baseY = item.comp.group.position.y;
      }
    });
  }

  setFactor(factor) {
    this.currentFactor = Math.max(0, Math.min(1, factor));

    this.offsets.forEach(item => {
      if (item.comp && item.comp.group) {
        item.comp.group.position.y = item.baseY + item.liftY * this.currentFactor;
      }
    });

    this.isExploded = this.currentFactor > 0.05;
  }

  toggle(duration = 1000) {
    const targetFactor = this.isExploded ? 0 : 1;
    this.animateTo(targetFactor, duration);
    return !this.isExploded;
  }

  animateTo(targetFactor, duration = 1000) {
    const animObj = { factor: this.currentFactor };

    new TWEEN.Tween(animObj)
      .to({ factor: targetFactor }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.setFactor(animObj.factor);
      })
      .start();
  }
}
