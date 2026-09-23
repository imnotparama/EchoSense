import * as TWEEN from '@tweenjs/tween.js';

export class ExplosionManager {
  constructor(components) {
    this.components = components;
    this.isExploded = false;
    this.currentFactor = 0;

    // Component explosion vertical lift offsets (in cm) - CAD Layer clearance
    this.liftMap = {
      oled: 4.5,
      esp32: 3.2,
      rgbLed: 2.8,
      capacitors: 2.4,
      buzzer: 2.2,
      inmp441: 2.0,
      transCircuit: 1.8,
      vibeMotor: 1.6,
      breadboard: -1.2
    };

    this.offsets = [
      { key: 'oled', comp: components.oled, liftY: 4.5 },
      { key: 'esp32', comp: components.esp32, liftY: 3.2 },
      { key: 'rgbLed', comp: components.rgbLed, liftY: 2.8 },
      { key: 'capacitors', comp: components.capacitors, liftY: 2.4 },
      { key: 'buzzer', comp: components.buzzer, liftY: 2.2 },
      { key: 'inmp441', comp: components.inmp441, liftY: 2.0 },
      { key: 'transCircuit', comp: components.transCircuit, liftY: 1.8 },
      { key: 'vibeMotor', comp: components.vibeMotor, liftY: 1.6 },
      { key: 'breadboard', comp: components.breadboard, liftY: -1.2 }
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

    // Dynamically stretch and curve jumper wires so they remain realistically connected
    if (this.components.wireManager && typeof this.components.wireManager.updateExplosion === 'function') {
      this.components.wireManager.updateExplosion(this.currentFactor, this.liftMap);
    }

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
