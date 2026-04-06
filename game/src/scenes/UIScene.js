// game/src/scenes/UIScene.js
import { ItemDefs } from '../data/ItemDefs.js';

export class UIScene extends Phaser.Scene {
    constructor() { super('UI'); }

    create() {
        this.worldScene = this.scene.get('World');
        this.inventory = this.worldScene.inventory;

        // --- Hotbar ---
        this.hotbarSlots = [];
        this.hotbarTexts = [];
        const SLOT_SIZE = 48;
        const SLOT_GAP = 4;
        const HOTBAR_SLOTS = 8;
        const hotbarWidth = HOTBAR_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
        const hotbarX = (this.cameras.main.width - hotbarWidth) / 2;
        const hotbarY = this.cameras.main.height - SLOT_SIZE - 12;

        for (let i = 0; i < HOTBAR_SLOTS; i++) {
            const x = hotbarX + i * (SLOT_SIZE + SLOT_GAP);
            const y = hotbarY;

            // Slot background
            const bg = this.add.rectangle(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x222222, 0.8);
            bg.setStrokeStyle(2, 0x555555);
            bg.setDepth(200);

            // Item icon (colored square, hidden initially)
            const icon = this.add.rectangle(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE - 8, SLOT_SIZE - 8, 0xffffff, 0);
            icon.setDepth(201);

            // Stack count text
            const txt = this.add.text(x + SLOT_SIZE - 4, y + SLOT_SIZE - 4, '', {
                fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(1, 1).setDepth(202);

            // Slot number label
            this.add.text(x + 4, y + 2, `${i + 1}`, {
                fontSize: '10px', fontFamily: 'Arial', color: '#888888',
            }).setDepth(202);

            this.hotbarSlots.push({ bg, icon });
            this.hotbarTexts.push(txt);
        }

        // Selection highlight
        this.selectionHighlight = this.add.rectangle(0, 0, SLOT_SIZE + 4, SLOT_SIZE + 4)
            .setStrokeStyle(2, 0xffcc00)
            .setFillStyle(0xffcc00, 0.1)
            .setDepth(203);

        this.slotSize = SLOT_SIZE;
        this.slotGap = SLOT_GAP;
        this.hotbarX = hotbarX;
        this.hotbarY = hotbarY;

        // --- Health Bar ---
        this.healthBarBg = this.add.rectangle(16, 16, 152, 18, 0x333333, 0.8).setOrigin(0, 0).setDepth(200);
        this.healthBar = this.add.rectangle(17, 17, 150, 16, 0xcc3333, 1).setOrigin(0, 0).setDepth(201);
        this.healthLabel = this.add.text(20, 18, 'HP', {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setDepth(202);

        // --- Hunger Bar ---
        this.hungerBarBg = this.add.rectangle(16, 38, 152, 18, 0x333333, 0.8).setOrigin(0, 0).setDepth(200);
        this.hungerBar = this.add.rectangle(17, 39, 150, 16, 0xccaa33, 1).setOrigin(0, 0).setDepth(201);
        this.hungerLabel = this.add.text(20, 40, 'Hunger', {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setDepth(202);

        // --- Inventory panel (hidden by default) ---
        this.inventoryPanel = null;
        this.inventoryOpen = false;

        // --- Crafting panel (hidden by default) ---
        this.craftingPanel = null;
        this.craftingOpen = false;

        // --- Listen for inventory changes ---
        this.inventory.onChange(() => this.refreshHotbar());
        this.refreshHotbar();

        console.log('[UIScene] HUD ready');
    }

    refreshHotbar() {
        const ITEM_COLORS = {
            Wood: 0x8b6914, Stone: 0x888888, WoodPlank: 0xc4a35a,
            StoneTool: 0xaaaaaa, WoodBlock: 0x8b6914, StoneBlock: 0x666666,
            CookedMeat: 0xcc6633,
        };

        for (let i = 0; i < 8; i++) {
            const slot = this.inventory.getSlot(i);
            const { icon } = this.hotbarSlots[i];
            const txt = this.hotbarTexts[i];

            if (slot) {
                const color = ITEM_COLORS[slot.itemId] || 0xffffff;
                icon.setFillStyle(color, 1);
                txt.setText(slot.quantity > 1 ? `${slot.quantity}` : '');
            } else {
                icon.setFillStyle(0xffffff, 0);
                txt.setText('');
            }
        }

        // Update selection highlight
        const selIdx = this.inventory.selectedSlot;
        const sx = this.hotbarX + selIdx * (this.slotSize + this.slotGap) + this.slotSize / 2;
        const sy = this.hotbarY + this.slotSize / 2;
        this.selectionHighlight.setPosition(sx, sy);
    }

    updateSurvivalBars(health, maxHealth, hunger, maxHunger) {
        this.healthBar.width = (health / maxHealth) * 150;
        this.hungerBar.width = (hunger / maxHunger) * 150;
    }

    update() {
        this.refreshHotbar();
    }
}
