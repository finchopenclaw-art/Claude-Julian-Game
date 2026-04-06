// game/src/data/TileConfig.js

// Tile type IDs
export const TILE = { GRASS: 0, DIRT: 1, SAND: 2, WATER: 3 };

// Tile properties
export const TileProps = {
    [TILE.GRASS]: { name: 'Grass', color: 0x4a7c59, walkable: true },
    [TILE.DIRT]:  { name: 'Dirt',  color: 0x8b7355, walkable: true },
    [TILE.SAND]:  { name: 'Sand',  color: 0xc2b280, walkable: true },
    [TILE.WATER]: { name: 'Water', color: 0x3a6ea5, walkable: false },
};

export const TILE_SIZE = 32;
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 50;

// Generate the map — mostly grass with some features
function generateMap() {
    const map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Border water
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                row.push(TILE.WATER);
            }
            // Small lake in the middle-right area
            else if (x >= 30 && x <= 35 && y >= 20 && y <= 25) {
                row.push(TILE.WATER);
            }
            // Dirt path
            else if (y >= 24 && y <= 26 && x >= 5 && x <= 28) {
                row.push(TILE.DIRT);
            }
            // Beach near lake
            else if (x >= 28 && x <= 37 && y >= 18 && y <= 27) {
                row.push(TILE.SAND);
            }
            // Dirt clearing near spawn
            else if (x >= 10 && x <= 15 && y >= 10 && y <= 15) {
                row.push(TILE.DIRT);
            }
            else {
                row.push(TILE.GRASS);
            }
        }
        map.push(row);
    }
    return map;
}

export const MAP_DATA = generateMap();

// Resource node spawn positions (tile coordinates)
export const RESOURCE_NODES = [
    // Trees — scattered in grassy areas
    { type: 'Tree', tileX: 5,  tileY: 5 },
    { type: 'Tree', tileX: 8,  tileY: 3 },
    { type: 'Tree', tileX: 3,  tileY: 12 },
    { type: 'Tree', tileX: 7,  tileY: 18 },
    { type: 'Tree', tileX: 15, tileY: 5 },
    { type: 'Tree', tileX: 20, tileY: 8 },
    { type: 'Tree', tileX: 22, tileY: 15 },
    { type: 'Tree', tileX: 18, tileY: 30 },
    { type: 'Tree', tileX: 10, tileY: 35 },
    { type: 'Tree', tileX: 40, tileY: 10 },
    { type: 'Tree', tileX: 42, tileY: 35 },
    { type: 'Tree', tileX: 35, tileY: 40 },
    // Rocks — scattered around
    { type: 'Rock', tileX: 6,  tileY: 8 },
    { type: 'Rock', tileX: 12, tileY: 20 },
    { type: 'Rock', tileX: 25, tileY: 12 },
    { type: 'Rock', tileX: 38, tileY: 5 },
    { type: 'Rock', tileX: 20, tileY: 40 },
    { type: 'Rock', tileX: 45, tileY: 30 },
    { type: 'Rock', tileX: 14, tileY: 42 },
    { type: 'Rock', tileX: 40, tileY: 44 },
    // Berry bushes — renewable food source
    { type: 'BerryBush', tileX: 9,  tileY: 8 },
    { type: 'BerryBush', tileX: 16, tileY: 12 },
    { type: 'BerryBush', tileX: 4,  tileY: 20 },
    { type: 'BerryBush', tileX: 25, tileY: 30 },
    { type: 'BerryBush', tileX: 38, tileY: 15 },
    { type: 'BerryBush', tileX: 12, tileY: 38 },
];

// Player spawn position (tile coordinates)
export const PLAYER_SPAWN = { tileX: 12, tileY: 12 };
