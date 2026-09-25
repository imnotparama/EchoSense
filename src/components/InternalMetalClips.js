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
    // Authentic Phosphor-Bronze spring alloy with high reflectivity
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0xcd853f, // Phosphor bronze
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.8
    });

    const yPos = this.breadboard.height / 2 + 0.05;

    // 1. Terminal Clips: 5-pin dual-leaf spring strips (63 rows * 2 sides = 126 clips)
    // Base runner strip
    const baseGeo = new THREE.BoxGeometry(0.12, 0.06, 1.18);
    const baseMesh = new THREE.InstancedMesh(baseGeo, clipMat, 126);
    baseMesh.receiveShadow = true;

    // Stamped dual-leaf spring prongs (5 pairs per clip = 10 prongs * 126 = 1260 prongs instanced)
    const prongGeo = new THREE.BoxGeometry(0.04, 0.28, 0.08);
    const prongMesh = new THREE.InstancedMesh(prongGeo, clipMat, 126 * 5 * 2);
    prongMesh.receiveShadow = true;

    const dummyBase = new THREE.Object3D();
    const dummyProng = new THREE.Object3D();
    let baseIdx = 0;
    let prongIdx = 0;

    const colOffsets = [-0.508, -0.254, 0, 0.254, 0.508]; // 5 pin positions spaced 2.54mm (0.254cm)

    for (let r = 1; r <= 63; r++) {
      const x = this.breadboard.getRowX(r);

      // Top strip (cols A-E, center Z = -0.95)
      dummyBase.position.set(x, yPos - 0.12, -0.95);
      dummyBase.updateMatrix();
      baseMesh.setMatrixAt(baseIdx++, dummyBase.matrix);

      colOffsets.forEach(co => {
        // Left leaf prong
        dummyProng.position.set(x - 0.04, yPos + 0.02, -0.95 + co);
        dummyProng.rotation.z = 0.08;
        dummyProng.updateMatrix();
        prongMesh.setMatrixAt(prongIdx++, dummyProng.matrix);

        // Right leaf prong
        dummyProng.position.set(x + 0.04, yPos + 0.02, -0.95 + co);
        dummyProng.rotation.z = -0.08;
        dummyProng.updateMatrix();
        prongMesh.setMatrixAt(prongIdx++, dummyProng.matrix);
      });

      // Bottom strip (cols F-J, center Z = 0.95)
      dummyBase.position.set(x, yPos - 0.12, 0.95);
      dummyBase.updateMatrix();
      baseMesh.setMatrixAt(baseIdx++, dummyBase.matrix);

      colOffsets.forEach(co => {
        // Left leaf prong
        dummyProng.position.set(x - 0.04, yPos + 0.02, 0.95 + co);
        dummyProng.rotation.z = 0.08;
        dummyProng.updateMatrix();
        prongMesh.setMatrixAt(prongIdx++, dummyProng.matrix);

        // Right leaf prong
        dummyProng.position.set(x + 0.04, yPos + 0.02, 0.95 + co);
        dummyProng.rotation.z = -0.08;
        dummyProng.updateMatrix();
        prongMesh.setMatrixAt(prongIdx++, dummyProng.matrix);
      });
    }

    baseMesh.instanceMatrix.needsUpdate = true;
    prongMesh.instanceMatrix.needsUpdate = true;
    this.group.add(baseMesh, prongMesh);

    // 2. Power Rail Continuous Bus Strips with stamped contact dimples
    const railBusGeo = new THREE.BoxGeometry(this.breadboard.length - 1.2, 0.22, 0.14);
    const rails = [
      this.breadboard.getRailZ('+top'), // -2.3
      this.breadboard.getRailZ('-top'), // -2.0
      this.breadboard.getRailZ('+bot'), // 2.0
      this.breadboard.getRailZ('-bot')  // 2.3
    ];

    rails.forEach(z => {
      const railMesh = new THREE.Mesh(railBusGeo, clipMat);
      railMesh.position.set(0, yPos - 0.04, z);
      this.group.add(railMesh);
    });
  }
}
