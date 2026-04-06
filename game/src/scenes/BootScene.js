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

        // Wood door texture (brown with darker handle area)
        const doorGfx = this.make.graphics({ add: false });
        doorGfx.fillStyle(0x9b7420, 1);
        doorGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        doorGfx.lineStyle(2, 0x7a5a10, 1);
        doorGfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        doorGfx.fillStyle(0x6b4f10, 1);
        doorGfx.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        doorGfx.fillStyle(0xddaa33, 1);
        doorGfx.fillCircle(TILE_SIZE - 8, TILE_SIZE / 2, 3); // door handle
        doorGfx.generateTexture('woodDoor', TILE_SIZE, TILE_SIZE);
        doorGfx.destroy();

        // Open door texture (thin frame, mostly transparent)
        const doorOpenGfx = this.make.graphics({ add: false });
        doorOpenGfx.fillStyle(0x9b7420, 0.4);
        doorOpenGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        doorOpenGfx.fillStyle(0x7a5a10, 1);
        doorOpenGfx.fillRect(0, 0, 4, TILE_SIZE);   // left edge
        doorOpenGfx.fillRect(TILE_SIZE - 4, 0, 4, TILE_SIZE); // right edge
        doorOpenGfx.generateTexture('woodDoorOpen', TILE_SIZE, TILE_SIZE);
        doorOpenGfx.destroy();

        // Fence texture (vertical posts with horizontal bar)
        const fenceGfx = this.make.graphics({ add: false });
        fenceGfx.fillStyle(0xa08040, 1);
        fenceGfx.fillRect(4, 0, 4, TILE_SIZE);   // left post
        fenceGfx.fillRect(24, 0, 4, TILE_SIZE);   // right post
        fenceGfx.fillRect(0, 8, TILE_SIZE, 4);    // top rail
        fenceGfx.fillRect(0, 20, TILE_SIZE, 4);   // bottom rail
        fenceGfx.generateTexture('fence', TILE_SIZE, TILE_SIZE);
        fenceGfx.destroy();

        // Torch texture (stick with flame)
        const torchGfx = this.make.graphics({ add: false });
        torchGfx.fillStyle(0x8b6914, 1);
        torchGfx.fillRect(13, 12, 6, 20); // stick
        torchGfx.fillStyle(0xff8800, 1);
        torchGfx.fillCircle(16, 10, 6);   // flame
        torchGfx.fillStyle(0xffcc00, 1);
        torchGfx.fillCircle(16, 9, 3);    // flame core
        torchGfx.generateTexture('torch', TILE_SIZE, TILE_SIZE);
        torchGfx.destroy();

        // Ladder texture (two rails with rungs)
        const ladderGfx = this.make.graphics({ add: false });
        ladderGfx.fillStyle(0x8b6914, 1);
        ladderGfx.fillRect(6, 0, 3, TILE_SIZE);   // left rail
        ladderGfx.fillRect(23, 0, 3, TILE_SIZE);   // right rail
        ladderGfx.fillRect(6, 5, 20, 3);    // rung 1
        ladderGfx.fillRect(6, 15, 20, 3);   // rung 2
        ladderGfx.fillRect(6, 25, 20, 3);   // rung 3
        ladderGfx.generateTexture('ladder', TILE_SIZE, TILE_SIZE);
        ladderGfx.destroy();

        // Stone brick texture (gray with brick pattern)
        const brickGfx = this.make.graphics({ add: false });
        brickGfx.fillStyle(0x777777, 1);
        brickGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        brickGfx.lineStyle(1, 0x555555, 1);
        brickGfx.strokeRect(0, 0, TILE_SIZE / 2, TILE_SIZE / 2);
        brickGfx.strokeRect(TILE_SIZE / 2, 0, TILE_SIZE / 2, TILE_SIZE / 2);
        brickGfx.strokeRect(TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
        brickGfx.lineStyle(2, 0x666666, 1);
        brickGfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        brickGfx.generateTexture('stoneBrick', TILE_SIZE, TILE_SIZE);
        brickGfx.destroy();

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
