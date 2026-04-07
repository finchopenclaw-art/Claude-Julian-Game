// WorldRenderer.js — Renders voxel world using Three.js InstancedMesh
import * as THREE from 'three';
import { BLOCK, BLOCK_COLORS, MAP_SIZE, MAX_HEIGHT } from './WorldData.js';
import { createBlockMaterials } from './BlockTextures.js';

export class WorldRenderer {
    constructor(scene, worldData) {
        this.scene = scene;
        this.worldData = worldData;
        this.meshes = {};  // blockType -> InstancedMesh
        this.resourceMeshes = []; // tree/rock/bush meshes
    }

    buildMeshes() {
        // Clear existing
        for (const mesh of Object.values(this.meshes)) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        this.meshes = {};

        // Count blocks per type
        const counts = {};
        for (let y = 0; y < MAX_HEIGHT; y++) {
            for (let z = 0; z < MAP_SIZE; z++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    const block = this.worldData.getBlock(x, y, z);
                    if (block !== BLOCK.AIR) {
                        counts[block] = (counts[block] || 0) + 1;
                    }
                }
            }
        }

        // Create InstancedMesh per block type with textures
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const dummy = new THREE.Object3D();
        const blockMaterials = createBlockMaterials();

        for (const [blockType, count] of Object.entries(counts)) {
            // Use textured material if available, otherwise fallback to flat color
            let material = blockMaterials[parseInt(blockType)];
            if (!material) {
                const color = BLOCK_COLORS[blockType] || 0xff00ff;
                material = new THREE.MeshLambertMaterial({ color });
            }

            // Water is slightly transparent and shorter
            if (parseInt(blockType) === BLOCK.WATER) {
                material.transparent = true;
                material.opacity = 0.6;
            }

            const mesh = new THREE.InstancedMesh(geometry, material, count);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            let idx = 0;
            for (let y = 0; y < MAX_HEIGHT; y++) {
                for (let z = 0; z < MAP_SIZE; z++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        if (this.worldData.getBlock(x, y, z) === parseInt(blockType)) {
                            const yOffset = parseInt(blockType) === BLOCK.WATER ? -0.2 : 0;
                            dummy.position.set(x, y + yOffset, z);
                            if (parseInt(blockType) === BLOCK.WATER) {
                                dummy.scale.set(1, 0.6, 1);
                            } else {
                                dummy.scale.set(1, 1, 1);
                            }
                            dummy.updateMatrix();
                            mesh.setMatrixAt(idx, dummy.matrix);
                            idx++;
                        }
                    }
                }
            }
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
            this.meshes[blockType] = mesh;
        }
    }

    addResourceNodes(nodes) {
        // Clear old
        for (const m of this.resourceMeshes) {
            this.scene.remove(m);
        }
        this.resourceMeshes = [];

        const NODE_VISUALS = {
            Tree: { color: 0x2d5a1e, trunkColor: 0x5a3a1a, height: 3 },
            Rock: { color: 0x888888, height: 1 },
            BerryBush: { color: 0x3a8a3a, berryColor: 0xcc2244, height: 1 },
            CoalOre: { color: 0x555555, spotColor: 0x222222, height: 1 },
            IronOre: { color: 0x777777, spotColor: 0xc4a87a, height: 1 },
        };

        for (const node of nodes) {
            const vis = NODE_VISUALS[node.type];
            if (!vis) continue;

            const group = new THREE.Group();
            group.position.set(node.x, 1, node.z);
            group.userData = { nodeData: node };

            if (node.type === 'Tree') {
                // Trunk
                const trunk = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 2, 0.3),
                    new THREE.MeshLambertMaterial({ color: vis.trunkColor })
                );
                trunk.position.y = 0.5;
                group.add(trunk);

                // Leaves
                const leaves = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 1.5, 1.5),
                    new THREE.MeshLambertMaterial({ color: vis.color })
                );
                leaves.position.y = 2;
                group.add(leaves);
            } else if (node.type === 'Rock') {
                const rock = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.6, 0.8),
                    new THREE.MeshLambertMaterial({ color: vis.color })
                );
                rock.position.y = -0.2;
                group.add(rock);
            } else if (node.type === 'BerryBush') {
                const bush = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.7, 0.8),
                    new THREE.MeshLambertMaterial({ color: vis.color })
                );
                bush.position.y = -0.15;
                group.add(bush);

                // Berry dots
                const berryGeo = new THREE.SphereGeometry(0.08, 4, 4);
                const berryMat = new THREE.MeshLambertMaterial({ color: vis.berryColor });
                for (const pos of [[0.2, 0.1, 0.3], [-0.3, 0, 0.2], [0.1, 0.15, -0.25]]) {
                    const berry = new THREE.Mesh(berryGeo, berryMat);
                    berry.position.set(...pos);
                    group.add(berry);
                }
            } else if (node.type === 'CoalOre' || node.type === 'IronOre') {
                // Ore block with colored spots
                const ore = new THREE.Mesh(
                    new THREE.BoxGeometry(0.9, 0.7, 0.9),
                    new THREE.MeshLambertMaterial({ color: vis.color })
                );
                ore.position.y = -0.15;
                group.add(ore);

                // Ore spots
                const spotGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
                const spotMat = new THREE.MeshLambertMaterial({ color: vis.spotColor });
                for (const pos of [[0.2, 0, 0.46], [-0.25, 0.1, 0.46], [0.1, -0.1, 0.46],
                                   [0.46, 0.05, 0.2], [0.46, -0.1, -0.15],
                                   [-0.2, 0.1, -0.46], [0.15, -0.05, -0.46]]) {
                    const spot = new THREE.Mesh(spotGeo, spotMat);
                    spot.position.set(...pos);
                    group.add(spot);
                }
            }

            this.scene.add(group);
            this.resourceMeshes.push(group);
        }

        return this.resourceMeshes;
    }
}
