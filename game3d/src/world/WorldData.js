// WorldData.js — Voxel world representation
// Each cell stores a block type. Y=0 is the floor.
// For the prototype: flat world, 1 block high, with some water dips.

export const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    SAND: 3,
    WATER: 4,
    STONE: 5,
    WOOD_BLOCK: 6,
    STONE_BLOCK: 7,
    WOOD_DOOR: 8,
    FENCE: 9,
    TORCH: 10,
    LADDER: 11,
    STONE_BRICK: 12,
};

export const BLOCK_COLORS = {
    [BLOCK.GRASS]:       0x4a7c59,
    [BLOCK.DIRT]:        0x8b7355,
    [BLOCK.SAND]:        0xc2b280,
    [BLOCK.WATER]:       0x3a6ea5,
    [BLOCK.STONE]:       0x888888,
    [BLOCK.WOOD_BLOCK]:  0x8b6914,
    [BLOCK.STONE_BLOCK]: 0x666666,
    [BLOCK.WOOD_DOOR]:   0x9b7420,
    [BLOCK.FENCE]:       0xa08040,
    [BLOCK.TORCH]:       0xff8800,
    [BLOCK.LADDER]:      0x8b6914,
    [BLOCK.STONE_BRICK]: 0x777777,
};

// Map from ItemDefs buildModelKey to BLOCK type
export const ITEM_TO_BLOCK = {
    woodBlock: BLOCK.WOOD_BLOCK,
    stoneBlock: BLOCK.STONE_BLOCK,
    woodDoor: BLOCK.WOOD_DOOR,
    fence: BLOCK.FENCE,
    torch: BLOCK.TORCH,
    ladder: BLOCK.LADDER,
    stoneBrick: BLOCK.STONE_BRICK,
};

export const BLOCK_TO_ITEM = {};
for (const [key, val] of Object.entries(ITEM_TO_BLOCK)) {
    BLOCK_TO_ITEM[val] = key;
}

export const MAP_SIZE = 50;
export const MAX_HEIGHT = 16;

export class WorldData {
    constructor() {
        // 3D array: blocks[y][z][x]
        this.blocks = [];
        for (let y = 0; y < MAX_HEIGHT; y++) {
            const layer = [];
            for (let z = 0; z < MAP_SIZE; z++) {
                layer.push(new Uint8Array(MAP_SIZE));
            }
            this.blocks.push(layer);
        }
        this.generateTerrain();
    }

    generateTerrain() {
        for (let z = 0; z < MAP_SIZE; z++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                // Border water
                if (x === 0 || z === 0 || x === MAP_SIZE - 1 || z === MAP_SIZE - 1) {
                    this.setBlock(x, 0, z, BLOCK.WATER);
                }
                // Lake
                else if (x >= 30 && x <= 35 && z >= 20 && z <= 25) {
                    this.setBlock(x, 0, z, BLOCK.WATER);
                }
                // Dirt path
                else if (z >= 24 && z <= 26 && x >= 5 && x <= 28) {
                    this.setBlock(x, 0, z, BLOCK.DIRT);
                }
                // Beach near lake
                else if (x >= 28 && x <= 37 && z >= 18 && z <= 27) {
                    this.setBlock(x, 0, z, BLOCK.SAND);
                }
                // Dirt clearing near spawn
                else if (x >= 10 && x <= 15 && z >= 10 && z <= 15) {
                    this.setBlock(x, 0, z, BLOCK.DIRT);
                }
                // Default grass
                else {
                    this.setBlock(x, 0, z, BLOCK.GRASS);
                }
            }
        }
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAX_HEIGHT || z < 0 || z >= MAP_SIZE) return BLOCK.AIR;
        return this.blocks[y][z][x];
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAX_HEIGHT || z < 0 || z >= MAP_SIZE) return;
        this.blocks[y][z][x] = type;
    }

    isWalkable(x, y, z) {
        const block = this.getBlock(x, y, z);
        return block === BLOCK.AIR;
    }

    isSolid(x, y, z) {
        const block = this.getBlock(x, y, z);
        return block !== BLOCK.AIR && block !== BLOCK.WATER;
    }
}

// Resource node positions (same as 2D but in 3D coords)
export const RESOURCE_NODES = [
    { type: 'Tree', x: 5, z: 5 },
    { type: 'Tree', x: 8, z: 3 },
    { type: 'Tree', x: 3, z: 12 },
    { type: 'Tree', x: 7, z: 18 },
    { type: 'Tree', x: 15, z: 5 },
    { type: 'Tree', x: 20, z: 8 },
    { type: 'Tree', x: 22, z: 15 },
    { type: 'Tree', x: 18, z: 30 },
    { type: 'Tree', x: 10, z: 35 },
    { type: 'Tree', x: 40, z: 10 },
    { type: 'Tree', x: 42, z: 35 },
    { type: 'Tree', x: 35, z: 40 },
    { type: 'Rock', x: 6, z: 8 },
    { type: 'Rock', x: 12, z: 20 },
    { type: 'Rock', x: 25, z: 12 },
    { type: 'Rock', x: 38, z: 5 },
    { type: 'Rock', x: 20, z: 40 },
    { type: 'Rock', x: 45, z: 30 },
    { type: 'Rock', x: 14, z: 42 },
    { type: 'Rock', x: 40, z: 44 },
    { type: 'BerryBush', x: 9, z: 8 },
    { type: 'BerryBush', x: 16, z: 12 },
    { type: 'BerryBush', x: 4, z: 20 },
    { type: 'BerryBush', x: 25, z: 30 },
    { type: 'BerryBush', x: 38, z: 15 },
    { type: 'BerryBush', x: 12, z: 38 },
];

export const PLAYER_SPAWN = { x: 12, z: 12 };
