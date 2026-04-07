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
        const hotbarY = this.cameras.main.height - SLOT_SIZE - 60;

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

            // Click to select slot
            bg.setInteractive({ useHandCursor: true });
            const slotIndex = i;
            bg.on('pointerdown', () => {
                this.inventory.selectSlot(slotIndex);
            });

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

        // --- Touch controls (only on touch devices) ---
        this.touchDir = { x: 0, y: 0 };
        this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (this.isTouch) {
            this._createTouchControls();
        }

        // --- Help overlay (shown on start) ---
        this.helpPanel = null;
        this.helpOpen = false;
        this._showHelp();

        // --- Listen for inventory changes ---
        this.inventory.onChange(() => {
            this.refreshHotbar();
            // Refresh open panels so recipes/items stay current
            if (this.craftingOpen) {
                this._hideCraftingPanel();
                this._showCraftingPanel();
            }
            if (this.inventoryOpen) {
                this._hideInventoryPanel();
                this._showInventoryPanel();
            }
        });
        this.refreshHotbar();

        console.log('[UIScene] HUD ready');
    }

    refreshHotbar() {
        const ITEM_COLORS = {
            Wood: 0x8b6914, Stone: 0x888888, WoodPlank: 0xc4a35a, Stick: 0xb89050,
            StoneTool: 0xaaaaaa, WoodBlock: 0x8b6914, StoneBlock: 0x666666,
            WoodDoor: 0x9b7420, Fence: 0xa08040, Torch: 0xff8800,
            Ladder: 0x8b6914, StoneBrick: 0x777777,
            CookedMeat: 0xcc6633, Berry: 0xcc2244, BerryPie: 0xdd6688,
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

    toggleInventory() {
        if (this.craftingOpen) return; // don't open both
        this.inventoryOpen = !this.inventoryOpen;
        if (this.inventoryOpen) {
            this._showInventoryPanel();
        } else {
            this._hideInventoryPanel();
        }
    }

    _showInventoryPanel() {
        const ITEM_COLORS = {
            Wood: 0x8b6914, Stone: 0x888888, WoodPlank: 0xc4a35a, Stick: 0xb89050,
            StoneTool: 0xaaaaaa, WoodBlock: 0x8b6914, StoneBlock: 0x666666,
            WoodDoor: 0x9b7420, Fence: 0xa08040, Torch: 0xff8800,
            Ladder: 0x8b6914, StoneBrick: 0x777777,
            CookedMeat: 0xcc6633, Berry: 0xcc2244, BerryPie: 0xdd6688,
        };

        // Track which slot is "picked up" for swapping
        if (this._swapFrom === undefined) this._swapFrom = -1;

        this.inventoryPanel = this.add.container(0, 0).setDepth(300);

        // Dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
        this.inventoryPanel.add(overlay);

        // Panel background
        const COLS = 5;
        const ROWS = 4;
        const SLOT = 52;
        const GAP = 4;
        const panelW = COLS * (SLOT + GAP) + GAP + 20;
        const panelH = ROWS * (SLOT + GAP) + GAP + 70;
        const px = (800 - panelW) / 2;
        const py = (600 - panelH) / 2;

        const panelBg = this.add.rectangle(400, 300, panelW, panelH, 0x1a1a2e, 0.95);
        panelBg.setStrokeStyle(2, 0x555555);
        panelBg.setInteractive(); // block clicks through
        this.inventoryPanel.add(panelBg);

        // Title
        const titleText = this._swapFrom >= 0 ? 'Inventory — Tap a slot to swap' : 'Inventory — Tap to move items';
        const title = this.add.text(400, py + 14, titleText, {
            fontSize: '14px', fontFamily: 'Arial', color: this._swapFrom >= 0 ? '#ffcc00' : '#ffffff',
        }).setOrigin(0.5, 0);
        this.inventoryPanel.add(title);

        // Close button
        const closeBtn = this.add.rectangle(px + panelW - 20, py + 20, 28, 28, 0x882222, 0.9)
            .setStrokeStyle(1, 0xaa4444).setInteractive({ useHandCursor: true });
        const closeTxt = this.add.text(px + panelW - 20, py + 20, 'X', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            this._swapFrom = -1;
            this.toggleInventory();
        });
        this.inventoryPanel.add(closeBtn);
        this.inventoryPanel.add(closeTxt);

        // Slots
        for (let i = 0; i < 20; i++) {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const sx = px + 10 + GAP + col * (SLOT + GAP) + SLOT / 2;
            const sy = py + 40 + GAP + row * (SLOT + GAP) + SLOT / 2;

            // Highlight the picked-up slot
            const isSelected = (i === this._swapFrom);
            const bgColor = isSelected ? 0x444400 : 0x222222;
            const borderColor = isSelected ? 0xffcc00 : 0x444444;

            const slotBg = this.add.rectangle(sx, sy, SLOT, SLOT, bgColor, 0.9);
            slotBg.setStrokeStyle(isSelected ? 2 : 1, borderColor);
            slotBg.setInteractive({ useHandCursor: true });
            this.inventoryPanel.add(slotBg);

            // Tap handler for swap
            const slotIndex = i;
            slotBg.on('pointerdown', () => {
                if (this._swapFrom < 0) {
                    // Pick up this slot
                    this._swapFrom = slotIndex;
                } else if (this._swapFrom === slotIndex) {
                    // Deselect
                    this._swapFrom = -1;
                } else {
                    // Swap and reset
                    this.inventory.swapSlots(this._swapFrom, slotIndex);
                    this._swapFrom = -1;
                }
                // Refresh panel to show updated state
                this._hideInventoryPanel();
                this._showInventoryPanel();
            });

            const slotData = this.inventory.getSlot(i);
            if (slotData) {
                const color = ITEM_COLORS[slotData.itemId] || 0xffffff;
                const icon = this.add.rectangle(sx, sy, SLOT - 10, SLOT - 10, color, 1);
                this.inventoryPanel.add(icon);

                if (slotData.quantity > 1) {
                    const qty = this.add.text(sx + SLOT / 2 - 6, sy + SLOT / 2 - 6, `${slotData.quantity}`, {
                        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
                        stroke: '#000000', strokeThickness: 2,
                    }).setOrigin(1, 1);
                    this.inventoryPanel.add(qty);
                }

                const nameTxt = this.add.text(sx, sy - SLOT / 2 + 4, ItemDefs[slotData.itemId]?.displayName || slotData.itemId, {
                    fontSize: '9px', fontFamily: 'Arial', color: '#aaaaaa',
                }).setOrigin(0.5, 0);
                this.inventoryPanel.add(nameTxt);
            }
        }
    }

    _hideInventoryPanel() {
        if (this.inventoryPanel) {
            this.inventoryPanel.destroy();
            this.inventoryPanel = null;
        }
    }

    toggleCrafting() {
        if (this.inventoryOpen) return; // don't open both
        this.craftingOpen = !this.craftingOpen;
        if (this.craftingOpen) {
            this._showCraftingPanel();
        } else {
            this._hideCraftingPanel();
        }
    }

    _showCraftingPanel(page) {
        const craftSystem = this.worldScene.craftSystem;
        this.craftingPanel = this.add.container(0, 0).setDepth(300);

        const RECIPES_PER_PAGE = 6;
        const recipes = craftSystem.getRecipes();
        const totalPages = Math.ceil(recipes.length / RECIPES_PER_PAGE);
        this._craftPage = Math.min(page || this._craftPage || 0, totalPages - 1);
        const startIdx = this._craftPage * RECIPES_PER_PAGE;
        const pageRecipes = recipes.slice(startIdx, startIdx + RECIPES_PER_PAGE);

        // Dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
        overlay.setInteractive();
        overlay.on('pointerdown', () => { this.toggleCrafting(); });
        this.craftingPanel.add(overlay);

        // Panel background
        const panelW = 360;
        const panelH = 56 * pageRecipes.length + 100;
        const px = (800 - panelW) / 2;
        const py = (600 - panelH) / 2;

        const panelBg = this.add.rectangle(400, 300, panelW, panelH, 0x1a1a2e, 0.95);
        panelBg.setStrokeStyle(2, 0x555555);
        panelBg.setInteractive(); // block clicks through to overlay
        this.craftingPanel.add(panelBg);

        // Title
        const title = this.add.text(400, py + 14, `Crafting (${this._craftPage + 1}/${totalPages})`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5, 0);
        this.craftingPanel.add(title);

        // Recipe list
        pageRecipes.forEach((recipe, i) => {
            const ry = py + 46 + i * 56;

            const rowColor = recipe.craftable ? 0x2a3a2a : 0x2a2a2a;
            const row = this.add.rectangle(400, ry + 22, panelW - 30, 48, rowColor, 0.9);
            row.setStrokeStyle(1, recipe.craftable ? 0x4ade80 : 0x444444);
            this.craftingPanel.add(row);

            const nameColor = recipe.craftable ? '#ffffff' : '#666666';
            const name = this.add.text(px + 24, ry + 6, recipe.displayName, {
                fontSize: '14px', fontFamily: 'Arial', color: nameColor, fontStyle: 'bold',
            });
            this.craftingPanel.add(name);

            const inputStr = Object.entries(recipe.inputs).map(([id, qty]) => `${qty} ${id}`).join(', ');
            const inputTxt = this.add.text(px + 24, ry + 24, `Needs: ${inputStr}`, {
                fontSize: '11px', fontFamily: 'Arial', color: recipe.craftable ? '#aaaaaa' : '#555555',
            });
            this.craftingPanel.add(inputTxt);

            const outputTxt = this.add.text(px + panelW - 24, ry + 14, `\u2192 ${recipe.outputQty} ${recipe.output}`, {
                fontSize: '11px', fontFamily: 'Arial', color: recipe.craftable ? '#4ade80' : '#555555',
            }).setOrigin(1, 0);
            this.craftingPanel.add(outputTxt);

            if (recipe.craftable) {
                row.setInteractive({ useHandCursor: true });
                row.on('pointerdown', () => {
                    craftSystem.craft(recipe.id);
                    this._hideCraftingPanel();
                    this._showCraftingPanel();
                });
            }
        });

        // Pagination buttons
        const navY = py + panelH - 30;
        if (this._craftPage > 0) {
            const prevBtn = this.add.rectangle(400 - 60, navY, 80, 30, 0x444444, 0.9)
                .setStrokeStyle(1, 0x666666).setInteractive({ useHandCursor: true });
            const prevTxt = this.add.text(400 - 60, navY, '\u25C0 Prev', {
                fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
            }).setOrigin(0.5);
            prevBtn.on('pointerdown', () => {
                this._craftPage--;
                this._hideCraftingPanel();
                this._showCraftingPanel();
            });
            this.craftingPanel.add(prevBtn);
            this.craftingPanel.add(prevTxt);
        }
        if (this._craftPage < totalPages - 1) {
            const nextBtn = this.add.rectangle(400 + 60, navY, 80, 30, 0x444444, 0.9)
                .setStrokeStyle(1, 0x666666).setInteractive({ useHandCursor: true });
            const nextTxt = this.add.text(400 + 60, navY, 'Next \u25B6', {
                fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
            }).setOrigin(0.5);
            nextBtn.on('pointerdown', () => {
                this._craftPage++;
                this._hideCraftingPanel();
                this._showCraftingPanel();
            });
            this.craftingPanel.add(nextBtn);
            this.craftingPanel.add(nextTxt);
        }

        // Close button
        const closeBtn = this.add.rectangle(px + panelW - 20, py + 20, 28, 28, 0x882222, 0.9)
            .setStrokeStyle(1, 0xaa4444).setInteractive({ useHandCursor: true });
        const closeTxt = this.add.text(px + panelW - 20, py + 20, 'X', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => { this.toggleCrafting(); });
        this.craftingPanel.add(closeBtn);
        this.craftingPanel.add(closeTxt);
    }

    _hideCraftingPanel() {
        if (this.craftingPanel) {
            this.craftingPanel.destroy();
            this.craftingPanel = null;
        }
    }

    toggleHelp() {
        this.helpOpen = !this.helpOpen;
        if (this.helpOpen) {
            this._showHelp();
        } else {
            this._hideHelp();
        }
    }

    _showHelp() {
        this.helpOpen = true;
        this.helpPanel = this.add.container(0, 0).setDepth(400);

        // Dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        overlay.setInteractive(); // block clicks through
        this.helpPanel.add(overlay);

        // Panel
        const panelW = 520;
        const panelH = 440;
        const px = (800 - panelW) / 2;
        const py = (600 - panelH) / 2;

        const bg = this.add.rectangle(400, 300, panelW, panelH, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(2, 0x4ade80);
        this.helpPanel.add(bg);

        // Title
        const title = this.add.text(400, py + 16, 'Survival Crafting', {
            fontSize: '22px', fontFamily: 'Arial', color: '#4ade80', fontStyle: 'bold',
        }).setOrigin(0.5, 0);
        this.helpPanel.add(title);

        // Goal section
        const goalY = py + 52;
        const goal = this.add.text(400, goalY, 'Gather resources. Craft tools. Build shelter. Survive.', {
            fontSize: '13px', fontFamily: 'Arial', color: '#cccccc', fontStyle: 'italic',
        }).setOrigin(0.5, 0);
        this.helpPanel.add(goal);

        // Gameplay steps — adapt text for touch vs keyboard
        const stepsY = goalY + 32;
        const touch = this.isTouch;
        const steps = touch ? [
            { icon: '1', title: 'GATHER', desc: 'Walk near trees/rocks using the D-pad, tap the green E button' },
            { icon: '2', title: 'CRAFT', desc: 'Tap C (top-right) to open crafting. Tap recipes to craft them' },
            { icon: '3', title: 'BUILD', desc: 'Tap a block in the hotbar, then tap Build to place it' },
            { icon: '4', title: 'SURVIVE', desc: 'Hunger drains over time. Tap food in hotbar, tap E to eat' },
        ] : [
            { icon: '1', title: 'GATHER', desc: 'Walk near trees or rocks and press E to collect Wood and Stone' },
            { icon: '2', title: 'CRAFT', desc: 'Press C to open crafting. Make planks, tools, and building blocks' },
            { icon: '3', title: 'BUILD', desc: 'Select a block in hotbar, then left-click to place it in the world' },
            { icon: '4', title: 'SURVIVE', desc: 'Your hunger drains over time. Select food and press E to eat' },
        ];

        steps.forEach((step, i) => {
            const sy = stepsY + i * 52;

            // Step number circle
            const circle = this.add.circle(px + 30, sy + 16, 14, 0x4ade80, 1);
            this.helpPanel.add(circle);
            const num = this.add.text(px + 30, sy + 16, step.icon, {
                fontSize: '14px', fontFamily: 'Arial', color: '#1a1a2e', fontStyle: 'bold',
            }).setOrigin(0.5);
            this.helpPanel.add(num);

            // Step title
            const titleTxt = this.add.text(px + 54, sy + 4, step.title, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            });
            this.helpPanel.add(titleTxt);

            // Step description
            const descTxt = this.add.text(px + 54, sy + 22, step.desc, {
                fontSize: '11px', fontFamily: 'Arial', color: '#999999',
            });
            this.helpPanel.add(descTxt);
        });

        // Controls section
        const controlsY = stepsY + steps.length * 52 + 12;
        const controlsTitle = this.add.text(400, controlsY, 'CONTROLS', {
            fontSize: '13px', fontFamily: 'Arial', color: '#4ade80', fontStyle: 'bold',
        }).setOrigin(0.5, 0);
        this.helpPanel.add(controlsTitle);

        const controls = touch ? [
            ['D-pad', 'Move around'],
            ['E btn', 'Gather / Eat'],
            ['Build btn', 'Place block'],
            ['Break btn', 'Remove block'],
            ['Hotbar', 'Tap to select'],
            ['C btn', 'Open crafting'],
            ['Inv btn', 'Open inventory'],
            ['\u2630 Menu', 'Save / Load / Help'],
        ] : [
            ['WASD', 'Move'],
            ['E', 'Gather / Eat'],
            ['C', 'Crafting'],
            ['Tab / I', 'Inventory'],
            ['1-8', 'Select hotbar slot'],
            ['Left Click', 'Place block'],
            ['Right Click', 'Remove block'],
            ['P', 'Save game'],
            ['L', 'Load game'],
            ['H', 'Toggle this help'],
        ];

        const col1X = px + 40;
        const col2X = px + 280;
        controls.forEach((ctrl, i) => {
            const col = i < 5 ? 0 : 1;
            const row = i < 5 ? i : i - 5;
            const cx = col === 0 ? col1X : col2X;
            const cy = controlsY + 22 + row * 20;

            const keyBg = this.add.rectangle(cx + 28, cy + 8, 60, 18, 0x333333, 0.9).setStrokeStyle(1, 0x555555);
            this.helpPanel.add(keyBg);
            const key = this.add.text(cx + 28, cy + 8, ctrl[0], {
                fontSize: '9px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            }).setOrigin(0.5);
            this.helpPanel.add(key);

            const action = this.add.text(cx + 66, cy + 8, ctrl[1], {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
            }).setOrigin(0, 0.5);
            this.helpPanel.add(action);
        });

        // Dismiss prompt
        const dismissY = py + panelH - 28;
        const dismiss = this.add.text(400, dismissY, touch ? 'Tap anywhere to start playing' : 'Press H or click anywhere to start playing', {
            fontSize: '12px', fontFamily: 'Arial', color: '#666666',
        }).setOrigin(0.5);
        this.helpPanel.add(dismiss);

        // Click overlay to dismiss
        overlay.on('pointerdown', () => {
            this._hideHelp();
        });
    }

    _hideHelp() {
        this.helpOpen = false;
        if (this.helpPanel) {
            this.helpPanel.destroy();
            this.helpPanel = null;
        }
    }

    // --- Touch Controls ---

    _touchBtn(x, y, w, h, label, color, depth = 500) {
        const bg = this.add.rectangle(x, y, w, h, color, 0.5)
            .setStrokeStyle(2, 0xffffff, 0.3)
            .setDepth(depth)
            .setScrollFactor(0)
            .setInteractive();
        const txt = this.add.text(x, y, label, {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);
        return { bg, txt };
    }

    _createTouchControls() {
        const B = 56; // button size
        const G = 6;  // gap

        // ===== D-PAD (bottom-left, above hotbar) =====
        const padX = 80;
        const padY = 410;

        // Up
        const upBtn = this._touchBtn(padX, padY - B - G, B, B, '\u25B2', 0x444444);
        upBtn.bg.on('pointerdown', () => { this.touchDir.y = -1; });
        upBtn.bg.on('pointerup', () => { this.touchDir.y = 0; });
        upBtn.bg.on('pointerout', () => { this.touchDir.y = 0; });

        // Down
        const downBtn = this._touchBtn(padX, padY + B + G, B, B, '\u25BC', 0x444444);
        downBtn.bg.on('pointerdown', () => { this.touchDir.y = 1; });
        downBtn.bg.on('pointerup', () => { this.touchDir.y = 0; });
        downBtn.bg.on('pointerout', () => { this.touchDir.y = 0; });

        // Left
        const leftBtn = this._touchBtn(padX - B - G, padY, B, B, '\u25C0', 0x444444);
        leftBtn.bg.on('pointerdown', () => { this.touchDir.x = -1; });
        leftBtn.bg.on('pointerup', () => { this.touchDir.x = 0; });
        leftBtn.bg.on('pointerout', () => { this.touchDir.x = 0; });

        // Right
        const rightBtn = this._touchBtn(padX + B + G, padY, B, B, '\u25B6', 0x444444);
        rightBtn.bg.on('pointerdown', () => { this.touchDir.x = 1; });
        rightBtn.bg.on('pointerup', () => { this.touchDir.x = 0; });
        rightBtn.bg.on('pointerout', () => { this.touchDir.x = 0; });

        // ===== ACTION BUTTONS (bottom-right) =====
        const actX = 720;
        const actY = 400;

        // Gather / Eat / Door button
        const gatherBtn = this._touchBtn(actX, actY, 64, 64, 'E', 0x2a7a2a);
        gatherBtn.bg.on('pointerdown', () => {
            this.scene.get('World').doInteract();
        });

        // Place button — places block next to player on touch
        const buildBtn = this._touchBtn(actX - 74, actY, 64, 64, 'Build', 0x2a4a7a);
        buildBtn.bg.on('pointerdown', () => {
            const ws = this.scene.get('World');
            // Auto-enter build mode if holding a Buildable item
            const selectedItem = ws.inventory.getSelectedItem();
            if (selectedItem && ItemDefs[selectedItem]?.category === 'Buildable') {
                if (!ws.buildSystem.active) {
                    ws.buildSystem.enterBuildMode(selectedItem);
                }
                ws.buildSystem.tryPlaceAtPlayer();
            }
        });

        // Remove block button — removes nearest block to player
        const removeBtn = this._touchBtn(actX, actY - 74, 64, 64, 'Break', 0x7a2a2a);
        removeBtn.bg.on('pointerdown', () => {
            const ws = this.scene.get('World');
            ws.buildSystem.tryRemoveNearest(ws.player.x, ws.player.y);
        });

        // ===== TOP MENU BUTTONS =====
        const topY = 18;
        const btnH = 32;
        const btnW = 52;

        // Crafting
        const craftBtn = this._touchBtn(800 - 30, topY + btnH / 2, btnW, btnH, 'C', 0x555555);
        craftBtn.bg.on('pointerdown', () => { this.toggleCrafting(); });

        // Inventory
        const invBtn = this._touchBtn(800 - 30 - btnW - 6, topY + btnH / 2, btnW, btnH, 'Inv', 0x555555);
        invBtn.bg.on('pointerdown', () => { this.toggleInventory(); });

        // Menu (Save/Load/Help)
        const menuBtn = this._touchBtn(800 - 30 - (btnW + 6) * 2, topY + btnH / 2, btnW, btnH, '\u2630', 0x555555);
        this.touchMenu = null;
        this.touchMenuOpen = false;
        menuBtn.bg.on('pointerdown', () => {
            if (this.touchMenuOpen) {
                this._hideTouchMenu();
            } else {
                this._showTouchMenu(menuBtn.bg.x, menuBtn.bg.y + btnH / 2 + 6);
            }
        });
    }

    _showTouchMenu(x, y) {
        this.touchMenuOpen = true;
        this.touchMenu = this.add.container(0, 0).setDepth(510);

        const items = [
            { label: 'Save', action: () => this.scene.get('World').saveGame() },
            { label: 'Load', action: () => this.scene.get('World').loadGame() },
            { label: 'Help', action: () => this.toggleHelp() },
        ];

        const mw = 80;
        const mh = 36;
        items.forEach((item, i) => {
            const iy = y + i * (mh + 4);
            const bg = this.add.rectangle(x, iy + mh / 2, mw, mh, 0x333333, 0.9)
                .setStrokeStyle(1, 0x666666)
                .setDepth(511)
                .setInteractive();
            const txt = this.add.text(x, iy + mh / 2, item.label, {
                fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
            }).setOrigin(0.5).setDepth(512);
            bg.on('pointerdown', () => {
                item.action();
                this._hideTouchMenu();
            });
            this.touchMenu.add(bg);
            this.touchMenu.add(txt);
        });
    }

    _hideTouchMenu() {
        this.touchMenuOpen = false;
        if (this.touchMenu) {
            this.touchMenu.destroy();
            this.touchMenu = null;
        }
    }
}
