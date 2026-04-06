// game/src/scenes/WorldScene.js
import { MAP_DATA, RESOURCE_NODES, PLAYER_SPAWN, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TileProps } from '../data/TileConfig.js';

export class WorldScene extends Phaser.Scene {
    constructor() { super('World'); }

    create() {
        // --- Tilemap ---
        const mapPixelW = MAP_WIDTH * TILE_SIZE;
        const mapPixelH = MAP_HEIGHT * TILE_SIZE;

        // Render tiles as sprites in a container for simplicity
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tileId = MAP_DATA[y][x];
                this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, `tile_${tileId}`);
            }
        }

        // --- World bounds ---
        this.physics.world.setBounds(0, 0, mapPixelW, mapPixelH);

        // --- Camera ---
        this.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH);

        // Placeholder: put a dot at player spawn so we can see the camera target
        const spawnX = PLAYER_SPAWN.tileX * TILE_SIZE + TILE_SIZE / 2;
        const spawnY = PLAYER_SPAWN.tileY * TILE_SIZE + TILE_SIZE / 2;
        const dot = this.add.circle(spawnX, spawnY, 6, 0xff0000);
        this.cameras.main.centerOn(spawnX, spawnY);

        console.log('[WorldScene] Tilemap rendered:', MAP_WIDTH, 'x', MAP_HEIGHT);
        this.scene.launch('UI');
    }
}
