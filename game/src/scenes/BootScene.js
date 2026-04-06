// game/src/scenes/BootScene.js
import { TileProps, TILE_SIZE } from '../data/TileConfig.js';

export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create() {
        // Generate tile textures
        for (const [id, props] of Object.entries(TileProps)) {
            const gfx = this.make.graphics({ add: false });
            gfx.fillStyle(props.color, 1);
            gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            // Subtle border for grid visibility
            gfx.lineStyle(1, 0x000000, 0.15);
            gfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
            gfx.generateTexture(`tile_${id}`, TILE_SIZE, TILE_SIZE);
            gfx.destroy();
        }

        // Player texture (24x24 blue square)
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(0x4488ff, 1);
        playerGfx.fillRect(0, 0, 24, 24);
        playerGfx.generateTexture('player', 24, 24);
        playerGfx.destroy();

        // Tree texture (28x28 dark green)
        const treeGfx = this.make.graphics({ add: false });
        treeGfx.fillStyle(0x2d5a1e, 1);
        treeGfx.fillRect(2, 2, 28, 28);
        treeGfx.fillStyle(0x1a3d12, 1);
        treeGfx.fillRect(10, 10, 12, 12); // trunk hint
        treeGfx.generateTexture('tree', 32, 32);
        treeGfx.destroy();

        // Rock texture (26x22 gray)
        const rockGfx = this.make.graphics({ add: false });
        rockGfx.fillStyle(0x888888, 1);
        rockGfx.fillRect(3, 5, 26, 22);
        rockGfx.fillStyle(0x999999, 1);
        rockGfx.fillRect(5, 7, 10, 8);
        rockGfx.generateTexture('rock', 32, 32);
        rockGfx.destroy();

        // Berry bush texture (green with red dots)
        const berryGfx = this.make.graphics({ add: false });
        berryGfx.fillStyle(0x3a8a3a, 1);
        berryGfx.fillRect(4, 6, 24, 20);
        berryGfx.fillStyle(0xcc2244, 1);
        berryGfx.fillCircle(10, 12, 3);
        berryGfx.fillCircle(22, 14, 3);
        berryGfx.fillCircle(15, 20, 3);
        berryGfx.generateTexture('berryBush', 32, 32);
        berryGfx.destroy();

        // Build block textures
        const woodBlockGfx = this.make.graphics({ add: false });
        woodBlockGfx.fillStyle(0x8b6914, 1);
        woodBlockGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        woodBlockGfx.lineStyle(2, 0x6b4f10, 1);
        woodBlockGfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        woodBlockGfx.generateTexture('woodBlock', TILE_SIZE, TILE_SIZE);
        woodBlockGfx.destroy();

        const stoneBlockGfx = this.make.graphics({ add: false });
        stoneBlockGfx.fillStyle(0x666666, 1);
        stoneBlockGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        stoneBlockGfx.lineStyle(2, 0x555555, 1);
        stoneBlockGfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        stoneBlockGfx.generateTexture('stoneBlock', TILE_SIZE, TILE_SIZE);
        stoneBlockGfx.destroy();

        // Ghost preview (semi-transparent white square)
        const ghostGfx = this.make.graphics({ add: false });
        ghostGfx.fillStyle(0xffffff, 1);
        ghostGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        ghostGfx.generateTexture('ghost', TILE_SIZE, TILE_SIZE);
        ghostGfx.destroy();

        console.log('[BootScene] Textures generated');
        this.scene.start('World');
    }
}
