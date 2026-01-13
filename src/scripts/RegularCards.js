import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class RegularCards {
  constructor() {
    this.cards = [];
  }

  createCards(scene, textureLoader, slabPlasticMaterial) {
    const cardGeometry = new RoundedBoxGeometry(1.5, 2.1, 0.05, 4, 0.06);

    const cardImages = [
      '/onlygoats-draft/assets/Gretzky OPC front.jpg',
      '/onlygoats-draft/assets/Henderson Topps front.jpg',
      '/onlygoats-draft/assets/Jordan Fleer front.jpg',
      '/onlygoats-draft/assets/Jordan Star front.jpg',
      '/onlygoats-draft/assets/Kiss Comic Front.jpg',
      '/onlygoats-draft/assets/Tiger Woods Front.jpg',
      '/onlygoats-draft/assets/Trout Bowman Auto front.jpg'
    ];

    const backTexture = textureLoader.load('/onlygoats-draft/assets/back.png');
    cardImages.forEach((imgPath, i) => {
      const frontTexture = textureLoader.load(imgPath);

      const materials = [
        slabPlasticMaterial,    // Right edge - plastic
        slabPlasticMaterial,    // Left edge - plastic
        slabPlasticMaterial,    // Top edge - plastic
        slabPlasticMaterial,    // Bottom edge - plastic
        new THREE.MeshStandardMaterial({ map: frontTexture }), // Front - card image
        new THREE.MeshStandardMaterial({ map: backTexture })   // Back - back design
      ];

      const cardMesh = new THREE.Mesh(cardGeometry, materials);
      cardMesh.position.x = i * 2.5 - 7.5;
      cardMesh.rotationSpeed = Math.random() * 0.005 + 0.002;
      scene.add(cardMesh);
      this.cards.push(cardMesh);
    });
  }

  animate(timer, scrollProgress, animationSpeed) {
    const baseRadiusX = 5;
    const baseRadiusY = 4;
    const radiusX = baseRadiusX + scrollProgress * 2;
    const radiusY = baseRadiusY + scrollProgress * 1.5;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];

      card.position.x = radiusX * Math.cos(timer * 0.01 + i);
      card.position.y = radiusY * Math.sin(timer * 0.01 + i * 1.1);
      card.position.z = 0;

      card.rotation.x += card.rotationSpeed * 0.1;
      card.rotation.y += card.rotationSpeed * 0.7;
      card.rotation.z = Math.sin(timer + i) * 0.2;
    }
  }
}
