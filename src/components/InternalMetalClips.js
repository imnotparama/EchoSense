import * as THREE from 'three';

export class InternalMetalClips {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Internal_Metal_Clips';
    this.group.visible = true;

    this.init();
  }

  init() {
    // Nickel/brass spring metal material
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Brass / gold-nickel
      metalness: 0.95,
      roughness: 0.2,
      envMapIntensity: 1.5
    });

    // 1. Terminal Clips (5-pin spring clips running across columns A-E and F-J)
    // 63 rows * 2 = 126 clips
    // Clip dimension: length across 5 pins = 4 * pitch + 0.15 = ~1.16cm, width = 0.18cm, height = 0.35cm
    const clipGeo = new THREE.BoxGeometry(0.18, 0.35, 1.15);
    const clipMesh = new THREE.InstancedMesh(clipGeo, clipMat, 126);
    clipMesh.castShadow = false;
    clipMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    const yPos = this.breadboard.height / 2 + 0.05;

    for (let r = 1; r <= 63; r++) {
      const x = this.breadboard.getRowX(r);

      // Top strip (cols A-E): center Z is (getColZ('A') + getColZ('E')) / 2 = (-1.45 + -0.45)/2 = -0.95
      dummy.position.set(x, yPos, -0.95);
      dummy.updateMatrix();
      clipMesh.setMatrixAt(idx++, dummy.matrix);

      // Bottom strip (cols F-J): center Z is (getColZ('F') + getColZ('J')) / 2 = (0.45 + 1.45)/2 = 0.95
      dummy.position.set(x, yPos, 0.95);
      dummy.updateMatrix();
      clipMesh.setMatrixAt(idx++, dummy.matrix);
    }

    clipMesh.instanceMatrix.needsUpdate = true;
    this.group.add(clipMesh);

    // 2. Power Rail Continuous Bus Strips (4 long metal rails running along the breadboard)
    // Length = 15.0cm, width = 0.18cm, height = 0.35cm
    const railBusGeo = new THREE.BoxGeometry(this.breadboard.length - 1.2, 0.35, 0.18);
    const rails = [
      this.breadboard.getRailZ('+top'), // -2.3
      this.breadboard.getRailZ('-top'), // -2.0
      this.breadboard.getRailZ('+bot'), // 2.0
      this.breadboard.getRailZ('-bot')  // 2.3
    ];

    rails.forEach(z => {
      const railMesh = new THREE.Mesh(railBusGeo, clipMat);
      railMesh.position.set(0, yPos, z);
      this.group.add(railMesh);
    });
  }
}
