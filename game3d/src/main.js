// main.js — 3D Survival Crafting Game entry point
import * as THREE from 'three';
import { WorldData, PLAYER_SPAWN, RESOURCE_NODES } from './world/WorldData.js';
import { WorldRenderer } from './world/WorldRenderer.js';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue
scene.fog = new THREE.Fog(0x87ceeb, 30, 60);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(PLAYER_SPAWN.x, 2.5, PLAYER_SPAWN.z + 5);
camera.lookAt(PLAYER_SPAWN.x, 1, PLAYER_SPAWN.z);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(20, 30, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 80;
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
scene.add(sunLight);

// --- World ---
const worldData = new WorldData();
const worldRenderer = new WorldRenderer(scene, worldData);
worldRenderer.buildMeshes();
const resourceMeshes = worldRenderer.addResourceNodes(RESOURCE_NODES);

// --- Player state (temporary, will be replaced by PlayerController) ---
const playerPos = new THREE.Vector3(PLAYER_SPAWN.x, 1.7, PLAYER_SPAWN.z);
camera.position.copy(playerPos);

// --- Pointer lock for mouselook ---
const clickToPlay = document.getElementById('click-to-play');

let yaw = 0;
let pitch = 0;
let locked = false;

clickToPlay.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === renderer.domElement;
    clickToPlay.style.display = locked ? 'none' : 'block';
});

document.addEventListener('mousemove', (e) => {
    if (!locked) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
});

// --- WASD movement ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Game loop ---
const moveSpeed = 5;
const clock = new THREE.Clock();

function update() {
    const dt = clock.getDelta();

    // Camera rotation
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement relative to camera facing
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const velocity = new THREE.Vector3(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp']) velocity.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) velocity.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) velocity.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) velocity.sub(right);

    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(moveSpeed * dt);

        // Simple collision: check if destination tile is walkable
        const nextX = playerPos.x + velocity.x;
        const nextZ = playerPos.z + velocity.z;
        const tileX = Math.floor(nextX);
        const tileZ = Math.floor(nextZ);

        // Check the block at foot level (y=1) — if air, we can walk there
        const blockAtFeet = worldData.getBlock(tileX, 1, tileZ);
        const blockBelow = worldData.getBlock(tileX, 0, tileZ);

        if (blockAtFeet === 0 && blockBelow !== 0) {
            playerPos.add(velocity);
        }
    }

    // Keep player at eye height
    playerPos.y = 1.7;
    camera.position.copy(playerPos);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

animate();

console.log('[Game3D] World loaded —', RESOURCE_NODES.length, 'resource nodes');

// Export for other modules to access
window.game3d = { scene, camera, renderer, worldData, worldRenderer, playerPos, resourceMeshes };
