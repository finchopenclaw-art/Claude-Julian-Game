// AnimalSystem.js — Spawns and manages wandering animals
import * as THREE from 'three';
import { BLOCK, MAP_SIZE } from '../world/WorldData.js';

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

        // Body
        const bodyGeo = new THREE.BoxGeometry(def.bodyW, def.bodyH, def.bodyD);
        const bodyMat = new THREE.MeshLambertMaterial({ color: def.bodyColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = def.bodyH / 2 - 0.1;
        body.castShadow = true;
        group.add(body);

        // Spots (cow only)
        if (def.spotColor) {
            const spotGeo = new THREE.BoxGeometry(0.35, 0.3, 0.5);
            const spotMat = new THREE.MeshLambertMaterial({ color: def.spotColor });
            const spot1 = new THREE.Mesh(spotGeo, spotMat);
            spot1.position.set(0.25, def.bodyH / 2, 0.2);
            group.add(spot1);
            const spot2 = new THREE.Mesh(spotGeo, spotMat);
            spot2.position.set(-0.2, def.bodyH / 2 - 0.1, -0.3);
            group.add(spot2);
        }

        // Head
        const headSize = type === 'Cow' ? 0.45 : 0.35;
        const headGeo = new THREE.BoxGeometry(headSize, headSize, headSize);
        const headMat = new THREE.MeshLambertMaterial({ color: def.headColor });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, def.bodyH / 2 + 0.05, def.bodyD / 2 + headSize / 2 - 0.05);
        head.castShadow = true;
        group.add(head);

        // Legs (4 small boxes)
        const legGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const legMat = new THREE.MeshLambertMaterial({ color: def.bodyColor });
        const legOffsets = [
            [-def.bodyW / 3, -0.3, def.bodyD / 3],
            [def.bodyW / 3, -0.3, def.bodyD / 3],
            [-def.bodyW / 3, -0.3, -def.bodyD / 3],
            [def.bodyW / 3, -0.3, -def.bodyD / 3],
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
