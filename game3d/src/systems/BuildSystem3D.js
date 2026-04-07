// BuildSystem3D.js — Place and remove blocks in 3D world
import * as THREE from 'three';
import { ItemDefs } from '../data/ItemDefs.js';
import { BLOCK, BLOCK_COLORS, ITEM_TO_BLOCK, BLOCK_TO_ITEM, MAP_SIZE, MAX_HEIGHT } from '../world/WorldData.js';

export class BuildSystem3D {
    constructor(scene, worldData, worldRenderer, inventory) {
        this.scene = scene;
        this.worldData = worldData;
        this.worldRenderer = worldRenderer;
        this.inventory = inventory;
        this.placedBlocks = []; // { mesh, x, y, z, blockType, itemId, open }
        this.previewMesh = null;
        this.active = false;
        this.currentItemId = null;

        // Create preview cube
        const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ff00, transparent: true, opacity: 0.3,
            wireframe: false, depthWrite: false,
        });
        this.previewMesh = new THREE.Mesh(geo, mat);
        this.previewMesh.visible = false;
        this.scene.add(this.previewMesh);
    }

    enterBuildMode(itemId) {
        const def = ItemDefs[itemId];
        if (!def || def.category !== 'Buildable') return;
        if (!this.inventory.hasItem(itemId, 1)) return;
        this.active = true;
        this.currentItemId = itemId;
    }

    exitBuildMode() {
        this.active = false;
        this.currentItemId = null;
        this.previewMesh.visible = false;
    }

    updatePreview(camera) {
        if (!this.active) {
            this.previewMesh.visible = false;
            return;
        }

        // Raycast from camera center
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        raycaster.far = 6;

        // Find placement position: the block adjacent to what we're looking at
        const target = this._getPlacementTarget(raycaster);
        if (target) {
            this.previewMesh.position.set(target.x + 0.5, target.y, target.z + 0.5);
            const canPlace = this._canPlace(target.x, target.y, target.z);
            this.previewMesh.material.color.setHex(canPlace ? 0x00ff00 : 0xff0000);
            this.previewMesh.visible = true;
        } else {
            this.previewMesh.visible = false;
        }
    }

    tryPlace(camera, playerPos) {
        if (!this.active) return false;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        raycaster.far = 6;

        const target = this._getPlacementTarget(raycaster);
        if (!target || !this._canPlace(target.x, target.y, target.z)) return false;
        if (!this.inventory.removeItem(this.currentItemId, 1)) return false;

        const def = ItemDefs[this.currentItemId];
        const blockType = ITEM_TO_BLOCK[def.buildModelKey] || BLOCK.WOOD_BLOCK;

        this._placeBlockMesh(target.x, target.y, target.z, blockType, this.currentItemId);

        if (!this.inventory.hasItem(this.currentItemId, 1)) {
            this.exitBuildMode();
        }
        return true;
    }

    tryPlaceAtPlayer(playerPos, facingX, facingZ) {
        if (!this.active) return false;

        const px = Math.floor(playerPos.x);
        const pz = Math.floor(playerPos.z);
        const y = 1; // place at foot level above ground

        // Try facing direction first, then alternatives
        const fx = Math.round(facingX) || 0;
        const fz = Math.round(facingZ) || 0;
        const offsets = [];
        if (fx !== 0 || fz !== 0) offsets.push([fx, fz]);
        for (const o of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
            if (!offsets.some(e => e[0] === o[0] && e[1] === o[1])) offsets.push(o);
        }

        for (const [dx, dz] of offsets) {
            const tx = px + dx;
            const tz = pz + dz;
            if (!this._canPlace(tx, y, tz)) continue;
            if (!this.inventory.removeItem(this.currentItemId, 1)) return false;

            const def = ItemDefs[this.currentItemId];
            const blockType = ITEM_TO_BLOCK[def.buildModelKey] || BLOCK.WOOD_BLOCK;
            this._placeBlockMesh(tx, y, tz, blockType, this.currentItemId);

            if (!this.inventory.hasItem(this.currentItemId, 1)) {
                this.exitBuildMode();
            }
            return true;
        }
        return false;
    }

    _placeBlockMesh(x, y, z, blockType, itemId) {
        this.worldData.setBlock(x, y, z, blockType);

        const color = BLOCK_COLORS[blockType] || 0xff00ff;
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + 0.5, y, z + 0.5);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.placedBlocks.push({ mesh, x, y, z, blockType, itemId, open: false });
    }

    tryRemove(camera, playerPos) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        raycaster.far = 6;

        // Check placed blocks
        const blockMeshes = this.placedBlocks.map(b => b.mesh);
        const hits = raycaster.intersectObjects(blockMeshes);

        if (hits.length > 0) {
            const hitMesh = hits[0].object;
            const idx = this.placedBlocks.findIndex(b => b.mesh === hitMesh);
            if (idx >= 0) {
                const block = this.placedBlocks[idx];
                this.worldData.setBlock(block.x, block.y, block.z, BLOCK.AIR);
                this.scene.remove(block.mesh);
                block.mesh.geometry.dispose();
                block.mesh.material.dispose();
                this.inventory.addItem(block.itemId, 1);
                this.placedBlocks.splice(idx, 1);
                return true;
            }
        }
        return false;
    }

    tryRemoveNearest(playerPos) {
        let nearest = -1;
        let nearestDist = Infinity;
        const maxDist = 4;

        for (let i = 0; i < this.placedBlocks.length; i++) {
            const b = this.placedBlocks[i];
            const bPos = new THREE.Vector3(b.x + 0.5, b.y, b.z + 0.5);
            const dist = playerPos.distanceTo(bPos);
            if (dist < maxDist && dist < nearestDist) {
                nearest = i;
                nearestDist = dist;
            }
        }
        if (nearest < 0) return false;

        const block = this.placedBlocks[nearest];
        this.worldData.setBlock(block.x, block.y, block.z, BLOCK.AIR);
        this.scene.remove(block.mesh);
        block.mesh.geometry.dispose();
        block.mesh.material.dispose();
        this.inventory.addItem(block.itemId, 1);
        this.placedBlocks.splice(nearest, 1);
        return true;
    }

    getNearestDoor(playerPos) {
        let nearest = null;
        let nearestDist = Infinity;
        for (const block of this.placedBlocks) {
            if (block.itemId !== 'WoodDoor') continue;
            const bPos = new THREE.Vector3(block.x + 0.5, 1, block.z + 0.5);
            const dist = new THREE.Vector2(playerPos.x - bPos.x, playerPos.z - bPos.z).length();
            if (dist < 3 && dist < nearestDist) {
                nearest = block;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    tryToggleDoor(playerPos) {
        const block = this.getNearestDoor(playerPos);
        if (!block) return false;

        block.open = !block.open;
        if (block.open) {
            block.mesh.material.opacity = 0.3;
            block.mesh.material.transparent = true;
            this.worldData.setBlock(block.x, block.y, block.z, BLOCK.AIR);
        } else {
            block.mesh.material.opacity = 1;
            block.mesh.material.transparent = false;
            this.worldData.setBlock(block.x, block.y, block.z, block.blockType);
        }
        return true;
    }

    _getPlacementTarget(raycaster) {
        // Step along the ray to find the first empty block adjacent to a solid one
        const step = 0.2;
        const dir = raycaster.ray.direction.clone().normalize();
        const pos = raycaster.ray.origin.clone();

        let prevX = -1, prevY = -1, prevZ = -1;

        for (let t = 0; t < raycaster.far; t += step) {
            const x = Math.floor(pos.x);
            const y = Math.floor(pos.y);
            const z = Math.floor(pos.z);

            if (x !== prevX || y !== prevY || z !== prevZ) {
                if (this.worldData.isSolid(x, y, z)) {
                    // Return the previous air position
                    if (prevX >= 0) return { x: prevX, y: prevY, z: prevZ };
                    return null;
                }
                prevX = x; prevY = y; prevZ = z;
            }

            pos.addScaledVector(dir, step);
        }
        return null;
    }

    _canPlace(x, y, z) {
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAX_HEIGHT || z < 0 || z >= MAP_SIZE) return false;
        if (this.worldData.getBlock(x, y, z) !== BLOCK.AIR) return false;
        // Don't place where player is standing
        return true;
    }
}
