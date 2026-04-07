// AnimalSystem.js — Spawns and manages wandering animals
import * as THREE from 'three';
import { BLOCK, MAP_SIZE } from '../world/WorldData.js';

// --- Procedural animal textures ---
const TEX = 16;

function hexToRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function multiNoise(ctx, shades) {
    const totalWeight = shades.reduce((s, sh) => s + sh[1], 0);
    const imgData = ctx.getImageData(0, 0, TEX, TEX);
    for (let i = 0; i < imgData.data.length; i += 4) {
        let r = Math.random() * totalWeight;
        let chosen = shades[0][0];
        for (const [color, weight] of shades) {
            r -= weight;
            if (r <= 0) { chosen = color; break; }
        }
        const [cr, cg, cb] = hexToRGB(chosen);
        imgData.data[i] = cr; imgData.data[i+1] = cg; imgData.data[i+2] = cb; imgData.data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}

function makeAnimalTex(shades, patches) {
    const c = document.createElement('canvas');
    c.width = TEX; c.height = TEX;
    const ctx = c.getContext('2d');
    multiNoise(ctx, shades);
    // Add patches (for cow spots, pig belly, etc.)
    if (patches) {
        for (const p of patches) {
            const [cr, cg, cb] = hexToRGB(p.color);
            ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Soften edges with noise
            for (let dy = 0; dy < p.h; dy++) {
                for (let dx = 0; dx < p.w; dx++) {
                    if (Math.random() > 0.7) {
                        const shade = shades[0][0];
                        const [sr, sg, sb] = hexToRGB(shade);
                        ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
                        ctx.fillRect(p.x + dx, p.y + dy, 1, 1);
                    }
                }
            }
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

function cowBodyTex() {
    return makeAnimalTex(
        [[0x8b6040, 3], [0x7a5030, 2], [0x9b7050, 1.5], [0x6a4525, 0.5]],
        [
            { x: 2, y: 2, w: 5, h: 5, color: 0xeeeeee },
            { x: 9, y: 6, w: 6, h: 4, color: 0xf0f0f0 },
            { x: 4, y: 10, w: 4, h: 5, color: 0xe8e8e8 },
            { x: 12, y: 12, w: 3, h: 3, color: 0xeeeeee },
        ]
    );
}

function cowHeadTex() {
    return makeAnimalTex(
        [[0x7a5535, 3], [0x6a4525, 2], [0x8a6545, 1]],
        [
            { x: 3, y: 10, w: 4, h: 3, color: 0x553322 }, // nostril area
            { x: 9, y: 10, w: 4, h: 3, color: 0x553322 },
            { x: 6, y: 2, w: 4, h: 3, color: 0xeeeeee },  // white blaze
        ]
    );
}

function cowLegTex() {
    return makeAnimalTex(
        [[0x6a4525, 3], [0x5a3515, 2], [0x7a5535, 1]],
        [{ x: 0, y: 12, w: 16, h: 4, color: 0x443322 }] // hooves
    );
}

function pigBodyTex() {
    return makeAnimalTex(
        [[0xddaaaa, 3], [0xcc9999, 2], [0xeebbbb, 1.5], [0xbb8888, 0.5]],
        [
            { x: 3, y: 8, w: 10, h: 6, color: 0xeecccc },  // belly
            { x: 1, y: 2, w: 3, h: 3, color: 0xcc9090 },   // mud spots
            { x: 10, y: 3, w: 4, h: 3, color: 0xcc9090 },
        ]
    );
}

function pigHeadTex() {
    return makeAnimalTex(
        [[0xcc8888, 3], [0xbb7777, 2], [0xdd9999, 1]],
        [
            { x: 5, y: 8, w: 6, h: 5, color: 0xeea0a0 },  // snout
            { x: 6, y: 9, w: 2, h: 2, color: 0x995555 },   // nostril
            { x: 8, y: 9, w: 2, h: 2, color: 0x995555 },
        ]
    );
}

function pigLegTex() {
    return makeAnimalTex(
        [[0xcc9999, 3], [0xbb8888, 2], [0xddaaaa, 1]],
        [{ x: 0, y: 12, w: 16, h: 4, color: 0x996666 }] // hooves
    );
}

const ANIMAL_DEFS = {
    Cow: {
        bodyColor: 0x8b6040,
        spotColor: 0xeeeeee,
        headColor: 0x7a5535,
        bodyW: 1.0, bodyH: 0.8, bodyD: 1.6,
        drops: [{ item: 'RawMeat', amount: 2 }, { item: 'Leather', amount: 1 }],
        hp: 3,
        speed: 1.0,
    },
    Pig: {
        bodyColor: 0xddaaaa,
        spotColor: null,
        headColor: 0xcc8888,
        bodyW: 0.7, bodyH: 0.6, bodyD: 1.0,
        drops: [{ item: 'RawMeat', amount: 3 }],
        hp: 2,
        speed: 1.2,
    },
};

// Where to spawn animals (tile coords, spread across the map)
const ANIMAL_SPAWNS = [
    { type: 'Cow', x: 20, z: 15 },
    { type: 'Cow', x: 35, z: 38 },
    { type: 'Cow', x: 8,  z: 30 },
    { type: 'Cow', x: 42, z: 20 },
    { type: 'Pig', x: 15, z: 25 },
    { type: 'Pig', x: 30, z: 10 },
    { type: 'Pig', x: 25, z: 42 },
    { type: 'Pig', x: 10, z: 18 },
];

export class AnimalSystem {
    constructor(scene, worldData, inventory) {
        this.scene = scene;
        this.worldData = worldData;
        this.inventory = inventory;
        this.animals = [];

        this._spawnAll();
    }

    _spawnAll() {
        for (const spawn of ANIMAL_SPAWNS) {
            this._spawnAnimal(spawn.type, spawn.x, spawn.z);
        }
    }

    _spawnAnimal(type, x, z) {
        const def = ANIMAL_DEFS[type];
        if (!def) return;

        const group = new THREE.Group();
        group.position.set(x + 0.5, 0.5, z + 0.5);

        // Positioning: legs touch ground (y=0 relative to group at ground surface)
        const legH = 0.4;
        const legY = legH / 2;              // leg center, bottom at y=0
        const bodyY = legH + def.bodyH / 2; // body sits on top of legs

        // Generate textures based on animal type
        const isCow = type === 'Cow';
        const bodyTex = isCow ? cowBodyTex() : pigBodyTex();
        const headTex = isCow ? cowHeadTex() : pigHeadTex();
        const legTex = isCow ? cowLegTex() : pigLegTex();

        // Body
        const bodyGeo = new THREE.BoxGeometry(def.bodyW, def.bodyH, def.bodyD);
        const bodyMat = new THREE.MeshLambertMaterial({ map: bodyTex });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = bodyY;
        body.castShadow = true;
        group.add(body);

        // Head
        const headSize = isCow ? 0.45 : 0.35;
        const headGeo = new THREE.BoxGeometry(headSize, headSize, headSize);
        const headMat = new THREE.MeshLambertMaterial({ map: headTex });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, bodyY + 0.05, def.bodyD / 2 + headSize / 2 - 0.05);
        head.castShadow = true;
        group.add(head);

        // Ears (small boxes on top of head)
        if (isCow) {
            const earGeo = new THREE.BoxGeometry(0.12, 0.08, 0.15);
            const earMat = new THREE.MeshLambertMaterial({ map: headTex });
            const earL = new THREE.Mesh(earGeo, earMat);
            earL.position.set(-headSize / 2 + 0.02, bodyY + headSize / 2 + 0.05, def.bodyD / 2 + headSize / 2 - 0.05);
            group.add(earL);
            const earR = new THREE.Mesh(earGeo, earMat);
            earR.position.set(headSize / 2 - 0.02, bodyY + headSize / 2 + 0.05, def.bodyD / 2 + headSize / 2 - 0.05);
            group.add(earR);
        }

        // Tail
        const tailGeo = new THREE.BoxGeometry(0.06, 0.06, 0.3);
        const tailMat = new THREE.MeshLambertMaterial({ map: bodyTex });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(0, bodyY + 0.1, -def.bodyD / 2 - 0.1);
        tail.rotation.x = -0.4;
        group.add(tail);

        // Legs (4 textured boxes)
        const legGeo = new THREE.BoxGeometry(0.15, legH, 0.15);
        const legMat = new THREE.MeshLambertMaterial({ map: legTex });
        const legOffsets = [
            [-def.bodyW / 3, legY, def.bodyD / 3],
            [def.bodyW / 3, legY, def.bodyD / 3],
            [-def.bodyW / 3, legY, -def.bodyD / 3],
            [def.bodyW / 3, legY, -def.bodyD / 3],
        ];
        for (const [lx, ly, lz] of legOffsets) {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(lx, ly, lz);
            group.add(leg);
        }

        this.scene.add(group);

        const animal = {
            group,
            type,
            def,
            hp: def.hp,
            maxHp: def.hp,
            spawnX: x,
            spawnZ: z,
            dead: false,
            // AI state
            state: 'idle',
            stateTimer: Math.random() * 3 + 1,
            targetX: x + 0.5,
            targetZ: z + 0.5,
            // Respawn
            respawnTime: 60000,
        };

        this.animals.push(animal);
    }

    update(dt) {
        for (const animal of this.animals) {
            if (animal.dead) continue;
            this._updateAI(animal, dt);
        }
    }

    _updateAI(animal, dt) {
        animal.stateTimer -= dt;

        if (animal.state === 'idle') {
            if (animal.stateTimer <= 0) {
                // Pick a random target within 6 tiles of spawn
                const range = 6;
                animal.targetX = animal.spawnX + (Math.random() - 0.5) * range * 2;
                animal.targetZ = animal.spawnZ + (Math.random() - 0.5) * range * 2;
                // Clamp to map
                animal.targetX = Math.max(2, Math.min(MAP_SIZE - 3, animal.targetX));
                animal.targetZ = Math.max(2, Math.min(MAP_SIZE - 3, animal.targetZ));
                animal.state = 'wander';
                animal.stateTimer = Math.random() * 4 + 2;
            }
        } else if (animal.state === 'wander') {
            const pos = animal.group.position;
            const dx = animal.targetX - pos.x;
            const dz = animal.targetZ - pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.3 || animal.stateTimer <= 0) {
                animal.state = 'idle';
                animal.stateTimer = Math.random() * 4 + 2;
            } else {
                const speed = animal.def.speed * dt;
                const mx = (dx / dist) * speed;
                const mz = (dz / dist) * speed;

                // Check collision
                const nextX = Math.floor(pos.x + mx);
                const nextZ = Math.floor(pos.z + mz);
                const block = this.worldData.getBlock(nextX, 0, nextZ);
                const blockAbove = this.worldData.getBlock(nextX, 1, nextZ);

                if (block !== BLOCK.WATER && block !== BLOCK.AIR && blockAbove === BLOCK.AIR) {
                    pos.x += mx;
                    pos.z += mz;

                    // Face movement direction
                    animal.group.rotation.y = Math.atan2(dx, dz);
                } else {
                    // Blocked — go idle
                    animal.state = 'idle';
                    animal.stateTimer = Math.random() * 2 + 1;
                }
            }

            // Simple leg animation — bob up and down slightly
            animal.group.position.y = 0.5 + Math.sin(performance.now() * 0.008) * 0.03;
        }
    }

    getNearestAnimal(playerPos) {
        let nearest = null;
        let nearestDist = Infinity;
        for (const animal of this.animals) {
            if (animal.dead) continue;
            const dist = new THREE.Vector2(
                playerPos.x - animal.group.position.x,
                playerPos.z - animal.group.position.z
            ).length();
            if (dist < 3 && dist < nearestDist) {
                nearest = animal;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    tryHarvest(playerPos, time) {
        const animal = this.getNearestAnimal(playerPos);
        if (!animal) return null;

        animal.hp -= 1;

        // Hit flash
        animal.group.children.forEach(c => {
            if (c.material) c.material.emissive?.setHex(0x440000);
        });
        setTimeout(() => {
            animal.group.children.forEach(c => {
                if (c.material) c.material.emissive?.setHex(0x000000);
            });
        }, 150);

        if (animal.hp <= 0) {
            // Animal dies — grant drops
            animal.dead = true;
            animal.group.visible = false;
            const drops = [];
            for (const drop of animal.def.drops) {
                const added = this.inventory.addItem(drop.item, drop.amount);
                drops.push(`+${added} ${drop.item}`);
            }

            // Respawn timer
            setTimeout(() => {
                animal.hp = animal.maxHp;
                animal.dead = false;
                animal.group.visible = true;
                animal.group.position.set(animal.spawnX + 0.5, 0.5, animal.spawnZ + 0.5);
                animal.state = 'idle';
                animal.stateTimer = 3;
            }, animal.respawnTime);

            return drops.join(', ');
        }

        return `Hit ${animal.type} (${animal.hp}/${animal.maxHp} HP)`;
    }
}
