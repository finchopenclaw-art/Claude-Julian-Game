// main.js — 3D Survival Crafting Game entry point
import * as THREE from 'three';
import { WorldData, PLAYER_SPAWN, RESOURCE_NODES, BLOCK } from './world/WorldData.js';
import { WorldRenderer } from './world/WorldRenderer.js';
import { Inventory } from './systems/Inventory.js';
import { CraftSystem } from './systems/CraftSystem.js';
import { SurvivalSystem } from './systems/SurvivalSystem.js';
import { GatherSystem3D } from './systems/GatherSystem3D.js';
import { BuildSystem3D } from './systems/BuildSystem3D.js';
import { ItemDefs } from './data/ItemDefs.js';
import { HUD } from './ui/HUD.js';
import { AnimalSystem } from './systems/AnimalSystem.js';
import { DayNightCycle } from './world/DayNightCycle.js';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 60);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

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

// --- Game Systems ---
const inventory = new Inventory(20);
inventory.addItem('CookedMeat', 3); // starting loadout

const craftSystem = new CraftSystem(inventory);
const survivalSystem = new SurvivalSystem(inventory);
const gatherSystem = new GatherSystem3D(inventory, resourceMeshes);
const buildSystem = new BuildSystem3D(scene, worldData, worldRenderer, inventory);

// --- Animals ---
const animalSystem = new AnimalSystem(scene, worldData, inventory);

// --- Day/Night Cycle ---
const dayNight = new DayNightCycle(scene, sunLight, ambientLight);

// --- HUD ---
const hud = new HUD(inventory, craftSystem, survivalSystem);

// --- Player state ---
const playerPos = new THREE.Vector3(PLAYER_SPAWN.x, 1.7, PLAYER_SPAWN.z);
camera.position.copy(playerPos);
let facingX = 0, facingZ = -1;
let isDead = false;

// --- Pointer lock ---
const clickToPlay = document.getElementById('click-to-play');
let yaw = 0, pitch = 0, locked = false;

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

// --- Input ---
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (hud.isAnyPanelOpen()) {
        if (e.code === 'Escape') hud._closePanel();
        return;
    }
    handleKeyAction(e.code);
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Mouse click — place/remove/gather
document.addEventListener('mousedown', (e) => {
    if (!locked || hud.isAnyPanelOpen()) return;
    if (e.button === 0) { // left click
        if (buildSystem.active) {
            buildSystem.tryPlace(camera, playerPos);
        }
    }
    if (e.button === 2) { // right click
        buildSystem.tryRemove(camera, playerPos);
    }
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function handleKeyAction(code) {
    if (isDead) return;

    // E — interact (door > eat > gather)
    if (code === 'KeyE') {
        doInteract();
    }
    // Q — place block
    if (code === 'KeyQ') {
        if (buildSystem.active) {
            buildSystem.tryPlace(camera, playerPos);
        } else {
            const sel = inventory.getSelectedItem();
            if (sel && ItemDefs[sel]?.category === 'Buildable') {
                buildSystem.enterBuildMode(sel);
                buildSystem.tryPlace(camera, playerPos);
            }
        }
    }
    // X — remove nearest block
    if (code === 'KeyX') {
        buildSystem.tryRemoveNearest(playerPos);
    }
    // C — crafting
    if (code === 'KeyC') { hud.toggleCrafting(); }
    // I or Tab — inventory
    if (code === 'KeyI' || code === 'Tab') { hud.toggleInventory(); }
    // 1-8 — hotbar
    for (let i = 0; i < 8; i++) {
        if (code === `Digit${i + 1}`) {
            inventory.selectSlot(i);
            // Auto enter/exit build mode
            const sel = inventory.getSelectedItem();
            if (sel && ItemDefs[sel]?.category === 'Buildable') {
                buildSystem.enterBuildMode(sel);
            } else {
                buildSystem.exitBuildMode();
            }
        }
    }
    // P — save
    if (code === 'KeyP') { saveGame(); }
    // L — load
    if (code === 'KeyL') { loadGame(); }
}

function doInteract() {
    // Door
    if (buildSystem.tryToggleDoor(playerPos)) return;
    // Eat
    const sel = inventory.getSelectedItem();
    if (sel && ItemDefs[sel]?.category === 'Consumable') {
        if (survivalSystem.tryEat(sel)) {
            hud.showFloatText('Ate ' + ItemDefs[sel].displayName);
            return;
        }
    }
    // Gather
    const result = gatherSystem.tryGather(playerPos, performance.now());
    if (result) {
        hud.showFloatText(`+${result.amount} ${result.item}`);
        return;
    }
    // Harvest animal
    const animalResult = animalSystem.tryHarvest(playerPos, performance.now());
    if (animalResult) {
        hud.showFloatText(animalResult);
    }
}

// Auto enter/exit build mode on inventory change
inventory.onChange(() => {
    const sel = inventory.getSelectedItem();
    if (sel && ItemDefs[sel]?.category === 'Buildable') {
        buildSystem.enterBuildMode(sel);
    } else if (buildSystem.active) {
        buildSystem.exitBuildMode();
    }
});

// HUD callbacks
hud.onSave = () => saveGame();
hud.onLoad = () => loadGame();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Save / Load ---
function saveGame() {
    const save = {
        player: { x: playerPos.x, y: playerPos.y, z: playerPos.z, yaw, pitch, timeOfDay: dayNight.timeOfDay },
        inventory: inventory.slots.map(s => s ? { itemId: s.itemId, quantity: s.quantity } : null),
        selectedSlot: inventory.selectedSlot,
        survival: { health: survivalSystem.health, hunger: survivalSystem.hunger },
        blocks: buildSystem.placedBlocks.map(b => ({
            x: b.x, y: b.y, z: b.z, blockType: b.blockType, itemId: b.itemId, open: b.open,
        })),
        nodes: gatherSystem.resourceMeshes.map(n => ({
            depleted: n.userData.depleted, hp: n.userData.hp,
        })),
    };
    localStorage.setItem('survival3dSave', JSON.stringify(save));
    hud.showFloatText('Game Saved!');
}

function loadGame() {
    const raw = localStorage.getItem('survival3dSave');
    if (!raw) { hud.showFloatText('No save found'); return; }
    const save = JSON.parse(raw);

    playerPos.set(save.player.x, save.player.y, save.player.z);
    yaw = save.player.yaw || 0;
    pitch = save.player.pitch || 0;
    if (save.player.timeOfDay !== undefined) dayNight.timeOfDay = save.player.timeOfDay;

    inventory.slots = save.inventory.map(s => s ? { ...s } : null);
    inventory.selectedSlot = save.selectedSlot || 0;
    inventory._notify();

    survivalSystem.health = save.survival.health;
    survivalSystem.hunger = save.survival.hunger;
    survivalSystem.lastHungerTick = performance.now();
    survivalSystem.lastStarveTick = performance.now();

    // Restore nodes
    if (save.nodes) {
        save.nodes.forEach((ns, i) => {
            if (i >= gatherSystem.resourceMeshes.length) return;
            const node = gatherSystem.resourceMeshes[i];
            node.userData.hp = ns.hp;
            node.userData.depleted = ns.depleted;
            node.visible = !ns.depleted;
            if (ns.depleted) {
                setTimeout(() => {
                    node.userData.hp = node.userData.maxHp;
                    node.userData.depleted = false;
                    node.visible = true;
                }, 5000);
            }
        });
    }

    // Restore placed blocks
    for (const b of buildSystem.placedBlocks) {
        scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
    }
    buildSystem.placedBlocks = [];
    if (save.blocks) {
        for (const b of save.blocks) {
            buildSystem._placeBlockMesh(b.x, b.y, b.z, b.blockType, b.itemId);
            if (b.open) {
                const block = buildSystem.placedBlocks[buildSystem.placedBlocks.length - 1];
                block.open = true;
                block.mesh.material.opacity = 0.3;
                block.mesh.material.transparent = true;
                worldData.setBlock(b.x, b.y, b.z, BLOCK.AIR);
            }
        }
    }

    isDead = false;
    hud.showFloatText('Game Loaded!');
}

// --- Game loop ---
const moveSpeed = 5;
const clock = new THREE.Clock();

function update() {
    const dt = clock.getDelta();
    const now = performance.now();

    // Death check
    if (survivalSystem.isDead() && !isDead) {
        isDead = true;
        hud.showFloatText('You died! Press L to load or refresh.');
    }
    if (isDead) return;

    // Survival
    survivalSystem.update(now);
    hud.updateBars();

    // Day/night
    dayNight.update(dt);

    // Animals
    animalSystem.update(dt);

    // Camera rotation
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    // Track facing
    facingX = forward.x;
    facingZ = forward.z;

    const speed = moveSpeed * survivalSystem.speedMultiplier;
    const velocity = new THREE.Vector3(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp']) velocity.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) velocity.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) velocity.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) velocity.sub(right);

    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(speed * dt);
        const nextX = playerPos.x + velocity.x;
        const nextZ = playerPos.z + velocity.z;
        const tileX = Math.floor(nextX);
        const tileZ = Math.floor(nextZ);
        const blockAtFeet = worldData.getBlock(tileX, 1, tileZ);
        const blockBelow = worldData.getBlock(tileX, 0, tileZ);
        if (blockAtFeet === 0 && blockBelow !== 0) {
            playerPos.add(velocity);
        }
    }

    playerPos.y = 1.7;
    camera.position.copy(playerPos);

    // Build preview
    buildSystem.updatePreview(camera);

    // Proximity hints
    const nearDoor = buildSystem.getNearestDoor(playerPos);
    const nearNode = gatherSystem.getNearestNode(playerPos);
    const nearAnimal = animalSystem.getNearestAnimal(playerPos);
    if (nearDoor) {
        hud.showGatherInfo(`Press E to ${nearDoor.open ? 'close' : 'open'} door`);
    } else if (nearNode) {
        hud.showGatherInfo(`Press E to gather ${nearNode.userData.nodeData.type}`);
    } else if (nearAnimal) {
        hud.showGatherInfo(`Press E to harvest ${nearAnimal.type} (${nearAnimal.hp}/${nearAnimal.maxHp} HP)`);
    } else {
        hud.hideGatherInfo();
    }
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

animate();

// Auto-load
if (localStorage.getItem('survival3dSave')) {
    loadGame();
}

console.log('[Game3D] All systems loaded');
