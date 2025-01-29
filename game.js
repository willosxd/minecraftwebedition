import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

class MinecraftGame {
  constructor() {
    window.addEventListener('start-game', () => this.initGame());
    this.blocks = []; // Array to track all blocks for collision
  }

  initGame() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);  
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());

    // Improved error handling for pointer lock
    this.controls.addEventListener('lock', () => {
      console.log('Pointer locked');
    });

    this.controls.addEventListener('unlock', () => {
      console.log('Pointer unlocked');
      // Optional: Reset game state or show menu
    });

    // Movement variables
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;

    // Movement speed and physics
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.gravity = -9.8;

    // Inventory system
    this.inventory = [
      { type: 'grass', texture: 'https://files.catbox.moe/ujfhnd.PNG', count: 10 },
      null, null, null, null, null, null, null, null
    ];
    this.selectedSlot = 0;

    // Block interaction setup
    this.raycaster = new THREE.Raycaster();
    this.blocks = [];
    this.createSuperFlatWorld();

    this.setupControls();
    this.setupKeyboardControls();
    this.setupInventoryControls();
    this.renderInventory();
    this.setupBlockInteraction();
    this.setupCollisionDetection();
    this.animate();
  }

  setupControls() {
    const gameContainer = document.getElementById('game-container');
    
    gameContainer.addEventListener('click', () => {
      try {
        this.controls.lock();
      } catch (error) {
        console.error('Failed to lock pointer:', error);
      }
    });

    // Add escape key to unlock
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.controls.unlock();
      }
    });
  }

  setupKeyboardControls() {
    const onKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.velocity.y += 5; 
            this.canJump = false;
          }
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  setupInventoryControls() {
    const inventorySlots = document.querySelectorAll('.inventory-slot');
    
    inventorySlots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        this.selectInventorySlot(index);
      });
    });

    // Number key selection
    document.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '9') {
        const slotIndex = parseInt(event.key) - 1;
        this.selectInventorySlot(slotIndex);
      }
    });
  }

  selectInventorySlot(index) {
    const inventorySlots = document.querySelectorAll('.inventory-slot');
    
    // Remove selected class from all slots
    inventorySlots.forEach(slot => {
      slot.classList.remove('selected');
    });

    // Add selected class to clicked slot
    inventorySlots[index].classList.add('selected');
    this.selectedSlot = index;
  }

  renderInventory() {
    const inventorySlots = document.querySelectorAll('.inventory-slot');
    
    this.inventory.forEach((item, index) => {
      const slot = inventorySlots[index];
      
      // Clear previous content
      slot.innerHTML = '';
      
      if (item) {
        const img = document.createElement('img');
        img.src = item.texture;
        slot.appendChild(img);
        
        // Add count text
        const countSpan = document.createElement('span');
        countSpan.textContent = item.count;
        slot.appendChild(countSpan);
      }
    });

    // Select first slot by default
    this.selectInventorySlot(0);
  }

  createSuperFlatWorld() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://files.catbox.moe/ujfhnd.PNG');
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Create blocks and add them to tracking array
    for (let x = -100; x < 100; x++) {
      for (let z = -100; z < 100; z++) {
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, 0, z);
        this.scene.add(cube);
        
        // Add to blocks array for collision detection
        this.blocks.push(cube);
      }
    }

    // Add ambient light to see the terrain better
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light for more depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Position camera slightly above the ground
    this.camera.position.y = 2;
    this.camera.position.z = 0;
  }

  setupBlockInteraction() {
    // Block placement and destruction
    document.addEventListener('mousedown', (event) => {
      // Only handle interactions when pointer is locked
      if (!this.controls.isLocked) return;

      // Left click (0) to destroy block, right click (2) to place block
      if (event.button === 0 || event.button === 2) {
        this.interactWithBlock(event.button);
      }
    });
  }

  interactWithBlock(mouseButton) {
    // Calculate intersection with blocks
    const camera = this.camera;
    this.raycaster.setFromCamera(new THREE.Vector2(), camera);

    const intersects = this.raycaster.intersectObjects(this.blocks);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const point = intersects[0].point;
      const normal = intersects[0].face.normal;

      // Determine block placement/destruction position
      const blockPosition = new THREE.Vector3(
        Math.round(point.x + normal.x * 0.5),
        Math.round(point.y + normal.y * 0.5),
        Math.round(point.z + normal.z * 0.5)
      );

      if (mouseButton === 0) {
        // Destroy block (left click)
        this.destroyBlock(intersectedObject);
      } else if (mouseButton === 2) {
        // Place block (right click)
        this.placeBlock(blockPosition);
      }
    }
  }

  destroyBlock(block) {
    // Prevent destroying ground level blocks
    if (block.position.y === 0) return;

    // Remove block from scene and blocks array
    this.scene.remove(block);
    this.blocks = this.blocks.filter(b => b !== block);
    block.geometry.dispose();
    block.material.dispose();
  }

  placeBlock(position) {
    // Check if current selected inventory slot has a block
    const selectedItem = this.inventory[this.selectedSlot];
    if (!selectedItem || selectedItem.count <= 0) return;

    // Check if placement would intersect with player
    const testBlock = new THREE.Box3().setFromCenterAndSize(
      position, 
      new THREE.Vector3(1, 1, 1)
    );
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      this.controls.getObject().position, 
      new THREE.Vector3(0.6, 1.8, 0.6)
    );

    // Prevent block placement inside player
    if (testBlock.intersectsBox(playerBox)) {
      return;
    }

    // Create and place new block
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(selectedItem.texture);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    
    cube.position.copy(position);
    this.scene.add(cube);
    this.blocks.push(cube);

    // Reduce inventory count
    selectedItem.count--;
    this.renderInventory();
  }

  setupCollisionDetection() {
    // Collision detection box for the player
    this.playerBox = new THREE.Box3();
    this.blockBox = new THREE.Box3();
  }

  checkCollision(position) {
    // Create bounding box for player's current position
    this.playerBox.setFromCenterAndSize(
      position, 
      new THREE.Vector3(0.6, 1.8, 0.6)  // Slightly smaller than a block
    );

    // Check collision with each block
    for (let block of this.blocks) {
      // Create bounding box for the block
      this.blockBox.setFromObject(block);

      // Check for intersection
      if (this.playerBox.intersectsBox(this.blockBox)) {
        return true;
      }
    }
    return false;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Movement logic
    if (this.controls.isLocked) {
      const delta = 0.1; 
      const moveSpeed = 0.1; 

      // Slightly reduce horizontal velocity to prevent excessive sliding
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;

      // Apply gravity
      this.velocity.y += this.gravity * delta;

      // Predict next position
      const currentPosition = this.controls.getObject().position.clone();
      const moveDirection = new THREE.Vector3();

      // Movement directions with collision prevention
      if (this.moveForward) {
        moveDirection.z -= moveSpeed;
      }
      if (this.moveBackward) {
        moveDirection.z += moveSpeed;
      }
      if (this.moveLeft) {
        moveDirection.x -= moveSpeed;
      }
      if (this.moveRight) {
        moveDirection.x += moveSpeed;
      }

      // Apply movement if no collision
      const newPosition = currentPosition.clone().add(
        moveDirection.applyQuaternion(this.controls.getObject().quaternion)
      );

      // Check if new position would cause a collision
      if (!this.checkCollision(newPosition)) {
        this.controls.moveRight(moveDirection.x);
        this.controls.moveForward(moveDirection.z);
      }

      // Ground collision and gravity
      if (this.controls.getObject().position.y < 2) {
        this.velocity.y = 0;
        this.controls.getObject().position.y = 2;
        this.canJump = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

new MinecraftGame();