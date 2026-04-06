// game/src/scenes/WorldScene.js
import { MAP_DATA, RESOURCE_NODES, PLAYER_SPAWN, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TileProps } from '../data/TileConfig.js';
import { Inventory } from '../systems/Inventory.js';
import { GatherSystem } from '../systems/GatherSystem.js';

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

        // --- Player ---
        const spawnX = PLAYER_SPAWN.tileX * TILE_SIZE + TILE_SIZE / 2;
        const spawnY = PLAYER_SPAWN.tileY * TILE_SIZE + TILE_SIZE / 2;
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // --- Camera follow ---
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // --- Input ---
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // --- Collision layer: invisible bodies on non-walkable tiles ---
        this.wallGroup = this.physics.add.staticGroup();
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tileId = MAP_DATA[y][x];
                if (!TileProps[tileId].walkable) {
                    const wall = this.wallGroup.create(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        null
                    );
                    wall.setVisible(false);
                    wall.body.setSize(TILE_SIZE, TILE_SIZE);
                    wall.refreshBody();
                }
            }
        }
        this.physics.add.collider(this.player, this.wallGroup);

        this.moveSpeed = 150;

        // --- Inventory ---
        this.inventory = new Inventory(20);
        // Starting loadout
        this.inventory.addItem('CookedMeat', 3);
        console.log('[WorldScene] Inventory ready, starting items:', this.inventory.countItem('CookedMeat'), 'CookedMeat');

        // --- Hotbar keys ---
        for (let i = 0; i < 8; i++) {
            this.input.keyboard.on(`keydown-${i + 1}`, () => {
                this.inventory.selectSlot(i);
                console.log('[Hotbar] Selected slot', i, this.inventory.getSlot(i));
            });
        }

        // --- Gather System ---
        this.gatherSystem = new GatherSystem(this, this.inventory);
        for (const node of RESOURCE_NODES) {
            this.gatherSystem.spawnNode(node.type, node.tileX, node.tileY, TILE_SIZE);
        }

        // --- Gather input (E key) ---
        this.input.keyboard.on('keydown-E', () => {
            this.gatherSystem.tryGather(this.time.now);
        });

        // --- Click to gather ---
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.gatherSystem.tryGather(this.time.now);
            }
        });

        // --- UI toggle keys ---
        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();
            this.scene.get('UI').toggleInventory();
        });
        this.input.keyboard.on('keydown-I', () => {
            this.scene.get('UI').toggleInventory();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            const ui = this.scene.get('UI');
            if (ui.inventoryOpen) ui.toggleInventory();
            if (ui.craftingOpen) ui.toggleCrafting();
        });

        console.log('[WorldScene] Player spawned at', spawnX, spawnY);
        this.scene.launch('UI');
    }

    update() {
        const speed = this.moveSpeed;
        let vx = 0;
        let vy = 0;

        if (this.keys.A.isDown) vx = -1;
        else if (this.keys.D.isDown) vx = 1;
        if (this.keys.W.isDown) vy = -1;
        else if (this.keys.S.isDown) vy = 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const diag = Math.SQRT1_2; // ~0.707
            vx *= diag;
            vy *= diag;
        }

        this.player.setVelocity(vx * speed, vy * speed);
        this.gatherSystem.update(this.player.x, this.player.y, this.time.now);
    }
}
