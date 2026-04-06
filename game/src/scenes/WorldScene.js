// game/src/scenes/WorldScene.js
import { MAP_DATA, RESOURCE_NODES, PLAYER_SPAWN, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TileProps } from '../data/TileConfig.js';
import { Inventory } from '../systems/Inventory.js';
import { GatherSystem } from '../systems/GatherSystem.js';
import { CraftSystem } from '../systems/CraftSystem.js';
import { BuildSystem } from '../systems/BuildSystem.js';
import { ItemDefs } from '../data/ItemDefs.js';
import { SurvivalSystem } from '../systems/SurvivalSystem.js';

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
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
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

        // --- Craft System ---
        this.craftSystem = new CraftSystem(this.inventory);

        // --- Build System ---
        this.buildSystem = new BuildSystem(this, this.inventory);

        // --- Survival System ---
        this.survivalSystem = new SurvivalSystem(this.inventory);
        this.survivalSystem.lastHungerTick = this.time.now;
        this.survivalSystem.lastStarveTick = this.time.now;

        // Enter build mode when selecting a Buildable item
        this.inventory.onChange(() => {
            const selectedItem = this.inventory.getSelectedItem();
            if (selectedItem && ItemDefs[selectedItem]?.category === 'Buildable') {
                this.buildSystem.enterBuildMode(selectedItem);
            } else if (this.buildSystem.active) {
                this.buildSystem.exitBuildMode();
            }
        });

        // --- Gather input (E key) ---
        this.input.keyboard.on('keydown-E', () => {
            // Try to eat if holding a consumable
            const selectedItem = this.inventory.getSelectedItem();
            if (selectedItem && ItemDefs[selectedItem]?.category === 'Consumable') {
                if (this.survivalSystem.tryEat(selectedItem)) return;
            }
            // Otherwise try to gather
            this.gatherSystem.tryGather(this.time.now);
        });

        // --- Mouse input (unified handler) ---
        // Use gameobject pointer to avoid conflicts with UI scene
        this.input.on('pointerdown', (pointer) => {
            // Don't process clicks if UI panels are open
            const ui = this.scene.get('UI');
            if (ui.inventoryOpen || ui.craftingOpen || ui.helpOpen) return;

            // Ignore clicks on the hotbar area (bottom 72px)
            if (pointer.y > this.cameras.main.height - 72) return;

            if (pointer.leftButtonDown()) {
                if (this.buildSystem.active) {
                    this.buildSystem.tryPlace(pointer, this.cameras.main);
                } else {
                    this.gatherSystem.tryGather(this.time.now);
                }
            }
            if (pointer.rightButtonDown()) {
                this.buildSystem.tryRemove(this.player.x, this.player.y, pointer, this.cameras.main);
            }
        });

        // Disable right-click context menu
        this.input.mouse.disableContextMenu();

        // --- UI toggle keys ---
        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();
            this.scene.get('UI').toggleInventory();
        });
        this.input.keyboard.on('keydown-I', () => {
            this.scene.get('UI').toggleInventory();
        });
        this.input.keyboard.on('keydown-C', () => {
            this.scene.get('UI').toggleCrafting();
        });
        this.input.keyboard.on('keydown-H', () => {
            this.scene.get('UI').toggleHelp();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            const ui = this.scene.get('UI');
            if (ui.helpOpen) { ui._hideHelp(); return; }
            if (ui.craftingOpen) { ui.toggleCrafting(); return; }
            if (ui.inventoryOpen) { ui.toggleInventory(); return; }
            if (this.buildSystem.active) { this.buildSystem.exitBuildMode(); return; }
        });

        // --- Save/Load ---
        this.input.keyboard.on('keydown-P', () => {
            this.saveGame();
        });
        this.input.keyboard.on('keydown-L', () => {
            this.loadGame();
        });

        console.log('[WorldScene] Player spawned at', spawnX, spawnY);
        this.scene.launch('UI');

        // Auto-load if save exists
        if (localStorage.getItem('survivalSave')) {
            this.loadGame();
            console.log('[WorldScene] Save loaded');
        }
    }

    saveGame() {
        const save = {
            player: { x: this.player.x, y: this.player.y },
            inventory: this.inventory.slots.map(s => s ? { itemId: s.itemId, quantity: s.quantity } : null),
            selectedSlot: this.inventory.selectedSlot,
            survival: {
                health: this.survivalSystem.health,
                hunger: this.survivalSystem.hunger,
            },
            blocks: this.buildSystem.placedBlocks.map(b => ({
                tileX: b.tileX, tileY: b.tileY, itemId: b.itemId,
            })),
            nodes: this.gatherSystem.nodes.map(n => ({
                active: n.active,
                hp: n.getData('hp'),
            })),
        };
        localStorage.setItem('survivalSave', JSON.stringify(save));

        // Flash save feedback
        const txt = this.add.text(this.player.x, this.player.y - 40, 'Game Saved!', {
            fontSize: '16px', fontFamily: 'Arial', color: '#4ade80',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
            targets: txt, y: txt.y - 30, alpha: 0, duration: 1200,
            onComplete: () => txt.destroy(),
        });
    }

    loadGame() {
        const raw = localStorage.getItem('survivalSave');
        if (!raw) return;
        const save = JSON.parse(raw);

        // Restore player position
        this.player.setPosition(save.player.x, save.player.y);

        // Restore inventory
        this.inventory.slots = save.inventory.map(s => s ? { ...s } : null);
        this.inventory.selectedSlot = save.selectedSlot || 0;
        this.inventory._notify();

        // Restore survival
        this.survivalSystem.health = save.survival.health;
        this.survivalSystem.hunger = save.survival.hunger;
        this.survivalSystem.lastHungerTick = this.time.now;
        this.survivalSystem.lastStarveTick = this.time.now;

        // Restore resource node states
        if (save.nodes) {
            save.nodes.forEach((ns, i) => {
                if (i >= this.gatherSystem.nodes.length) return;
                const node = this.gatherSystem.nodes[i];
                node.setData('hp', ns.hp);
                if (!ns.active) {
                    node.setActive(false).setVisible(false);
                    node.body.enable = false;
                    // Schedule respawn
                    const type = node.getData('type');
                    const maxHp = node.getData('maxHp');
                    this.time.delayedCall(5000, () => {
                        node.setData('hp', maxHp);
                        node.setActive(true).setVisible(true);
                        node.body.enable = true;
                    });
                }
            });
        }

        // Restore placed blocks — clear existing first
        for (const block of this.buildSystem.placedBlocks) {
            block.sprite.destroy();
        }
        this.buildSystem.placedBlocks = [];

        if (save.blocks) {
            for (const b of save.blocks) {
                const def = ItemDefs[b.itemId];
                if (!def) continue;
                const snapX = b.tileX * TILE_SIZE + TILE_SIZE / 2;
                const snapY = b.tileY * TILE_SIZE + TILE_SIZE / 2;
                const sprite = this.physics.add.staticSprite(snapX, snapY, def.buildModelKey || 'ghost');
                sprite.setDepth(4);
                sprite.refreshBody();
                this.physics.add.collider(this.player, sprite);
                this.buildSystem.placedBlocks.push({ sprite, tileX: b.tileX, tileY: b.tileY, itemId: b.itemId });
            }
        }

        // Clear death state if loading a non-dead save
        if (this.deathText) {
            this.deathText.destroy();
            this.deathText = null;
        }
    }

    update() {
        if (this.survivalSystem.isDead()) {
            this.player.setVelocity(0, 0);
            if (!this.deathText) {
                this.deathText = this.add.text(this.player.x, this.player.y - 40, 'You died! Refresh to restart.', {
                    fontSize: '18px', fontFamily: 'Arial', color: '#ff4444',
                    stroke: '#000000', strokeThickness: 3,
                }).setOrigin(0.5).setDepth(200);
            }
            return; // stop all updates
        }

        const speed = this.moveSpeed * this.survivalSystem.speedMultiplier;
        let vx = 0;
        let vy = 0;

        // Keyboard input
        if (this.keys.A.isDown || this.keys.LEFT.isDown) vx = -1;
        else if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx = 1;
        if (this.keys.W.isDown || this.keys.UP.isDown) vy = -1;
        else if (this.keys.S.isDown || this.keys.DOWN.isDown) vy = 1;

        // Touch D-pad input (merge with keyboard)
        const ui = this.scene.get('UI');
        if (ui && ui.touchDir) {
            if (ui.touchDir.x !== 0) vx = ui.touchDir.x;
            if (ui.touchDir.y !== 0) vy = ui.touchDir.y;
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const diag = Math.SQRT1_2; // ~0.707
            vx *= diag;
            vy *= diag;
        }

        this.player.setVelocity(vx * speed, vy * speed);
        this.gatherSystem.update(this.player.x, this.player.y, this.time.now);
        this.buildSystem.update(this.input.activePointer, this.cameras.main);

        // Survival
        this.survivalSystem.update(this.time.now);

        // Update UI bars
        const ui = this.scene.get('UI');
        if (ui && ui.updateSurvivalBars) {
            ui.updateSurvivalBars(
                this.survivalSystem.health, this.survivalSystem.maxHealth,
                this.survivalSystem.hunger, this.survivalSystem.maxHunger
            );
        }
    }
}
