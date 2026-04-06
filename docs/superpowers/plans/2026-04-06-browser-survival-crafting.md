# Browser Survival Crafting Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable 2D top-down browser survival crafting prototype with Phaser 3 — gather, craft, build, survive.

**Architecture:** Three-layer design — Phaser Scenes (rendering/input), Systems (game logic as ES modules), Data (item/recipe/tile definitions). All client-side, no server, no build step. Phaser loaded from CDN.

**Tech Stack:** Phaser 3 (CDN), Vanilla JavaScript (ES modules), HTML5

**Testing approach:** This is a zero-build-step browser game. No test framework. Each task includes manual verification steps — open the game, perform actions, check console output and visual results. The data modules and systems are designed as pure logic that can be verified via browser console.

**Dev server:** Use `npx serve game` or Python `python -m http.server` from the `game/` directory. ES modules require a server (can't use `file://`).

---

## File Map

| File | Responsibility | Created in Task |
|------|---------------|-----------------|
| `game/index.html` | Entry point, loads Phaser CDN, boots game | 1 |
| `game/src/data/ItemDefs.js` | Item database (id, name, maxStack, category) | 1 |
| `game/src/data/RecipeDefs.js` | Crafting recipe database | 1 |
| `game/src/data/TileConfig.js` | Map layout array + resource node positions | 2 |
| `game/src/scenes/BootScene.js` | Generate textures, transition to gameplay | 2 |
| `game/src/scenes/WorldScene.js` | Main gameplay — tilemap, player, systems | 3 |
| `game/src/systems/Inventory.js` | Item storage, stacking, slot management | 4 |
| `game/src/systems/GatherSystem.js` | Resource node interaction, rewards, respawn | 5 |
| `game/src/scenes/UIScene.js` | HUD overlay — hotbar, panels, bars | 6 |
| `game/src/systems/CraftSystem.js` | Recipe validation, item transformation | 8 |
| `game/src/systems/BuildSystem.js` | Placement preview, validation, removal | 9 |
| `game/src/systems/SurvivalSystem.js` | Hunger depletion, consequences, food | 10 |

---

### Task 1: Project Skeleton + Data Modules

**Files:**
- Create: `game/index.html`
- Create: `game/src/data/ItemDefs.js`
- Create: `game/src/data/RecipeDefs.js`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survival Crafting Game</title>
    <style>
        * { margin: 0; padding: 0; }
        body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
    <script type="module">
        import { BootScene } from './src/scenes/BootScene.js';
        import { WorldScene } from './src/scenes/WorldScene.js';
        import { UIScene } from './src/scenes/UIScene.js';

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: document.body,
            backgroundColor: '#1a1a2e',
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: [BootScene, WorldScene, UIScene]
        };

        const game = new Phaser.Game(config);
    </script>
</body>
</html>
```

- [ ] **Step 2: Create ItemDefs.js**

```js
// game/src/data/ItemDefs.js
export const ItemDefs = {
    Wood:       { displayName: 'Wood',       maxStack: 64, category: 'Resource' },
    Stone:      { displayName: 'Stone',      maxStack: 64, category: 'Resource' },
    WoodPlank:  { displayName: 'Wood Plank', maxStack: 64, category: 'Resource' },
    StoneTool:  { displayName: 'Stone Tool', maxStack: 1,  category: 'Tool' },
    WoodBlock:  { displayName: 'Wood Block', maxStack: 64, category: 'Buildable', buildModelKey: 'woodBlock' },
    StoneBlock: { displayName: 'Stone Block',maxStack: 64, category: 'Buildable', buildModelKey: 'stoneBlock' },
    CookedMeat: { displayName: 'Cooked Meat',maxStack: 16, category: 'Consumable', hungerRestore: 30 },
};
```

- [ ] **Step 3: Create RecipeDefs.js**

```js
// game/src/data/RecipeDefs.js
export const RecipeDefs = {
    CraftWoodPlank: {
        displayName: 'Wood Plank',
        inputs: { Wood: 2 },
        output: 'WoodPlank',
        outputQty: 4,
    },
    CraftStoneTool: {
        displayName: 'Stone Tool',
        inputs: { Stone: 5, Wood: 2 },
        output: 'StoneTool',
        outputQty: 1,
    },
    CraftWoodBlock: {
        displayName: 'Wood Block',
        inputs: { WoodPlank: 4 },
        output: 'WoodBlock',
        outputQty: 2,
    },
    CraftStoneBlock: {
        displayName: 'Stone Block',
        inputs: { Stone: 6 },
        output: 'StoneBlock',
        outputQty: 2,
    },
};
```

- [ ] **Step 4: Verify modules load**

Create placeholder scenes so the game boots without errors. Create these minimal files:

`game/src/scenes/BootScene.js`:
```js
export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() {
        console.log('[BootScene] ready');
        this.scene.start('World');
    }
}
```

`game/src/scenes/WorldScene.js`:
```js
export class WorldScene extends Phaser.Scene {
    constructor() { super('World'); }
    create() {
        console.log('[WorldScene] ready');
        this.scene.launch('UI');
    }
}
```

`game/src/scenes/UIScene.js`:
```js
export class UIScene extends Phaser.Scene {
    constructor() { super('UI'); }
    create() {
        console.log('[UIScene] ready');
    }
}
```

Run: `npx serve game` (or `python -m http.server 3000` from `game/` dir)
Open: `http://localhost:3000`
Expected: Black screen, browser console shows `[BootScene] ready`, `[WorldScene] ready`, `[UIScene] ready`. No errors.

- [ ] **Step 5: Commit**

```bash
git add game/
git commit -m "feat: project skeleton with Phaser 3, data modules, placeholder scenes"
```

---

### Task 2: TileConfig + BootScene Textures + Tilemap Rendering

**Files:**
- Create: `game/src/data/TileConfig.js`
- Modify: `game/src/scenes/BootScene.js`
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Create TileConfig.js with map layout and resource positions**

```js
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
];

// Player spawn position (tile coordinates)
export const PLAYER_SPAWN = { tileX: 12, tileY: 12 };
```

- [ ] **Step 2: Update BootScene to generate textures programmatically**

Replace `game/src/scenes/BootScene.js` entirely:

```js
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
```

- [ ] **Step 3: Update WorldScene to render the tilemap**

Replace `game/src/scenes/WorldScene.js`:

```js
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
```

- [ ] **Step 4: Verify tilemap renders**

Run: `npx serve game`
Open: `http://localhost:3000`
Expected: Colored tile grid visible — green grass, brown dirt path, tan sand, blue water border and lake. Red dot at player spawn (tile 12,12). No errors in console.

- [ ] **Step 5: Commit**

```bash
git add game/
git commit -m "feat: tilemap rendering with generated textures and map layout"
```

---

### Task 3: Player Movement + Collision

**Files:**
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Add player sprite with physics**

In `WorldScene.create()`, replace the red dot placeholder with a physics-enabled player sprite. Add after the tilemap rendering code, replacing the placeholder dot section:

```js
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

        console.log('[WorldScene] Player spawned at', spawnX, spawnY);
        this.scene.launch('UI');
```

- [ ] **Step 2: Add update loop for WASD movement**

Add `update()` method to WorldScene:

```js
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
    }
```

- [ ] **Step 3: Verify movement and collision**

Run: `npx serve game`
Expected:
- Blue square at spawn position
- WASD moves the player smoothly
- Camera follows with slight smoothing
- Player cannot walk into water (blue tiles)
- Player cannot walk off the map edge
- Diagonal movement is not faster than cardinal

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: player movement with WASD, camera follow, tile collision"
```

---

### Task 4: Inventory System

**Files:**
- Create: `game/src/systems/Inventory.js`

- [ ] **Step 1: Implement the Inventory class**

```js
// game/src/systems/Inventory.js
import { ItemDefs } from '../data/ItemDefs.js';

export class Inventory {
    constructor(size = 20) {
        this.size = size;
        // Each slot: { itemId: string, quantity: number } or null
        this.slots = new Array(size).fill(null);
        this.selectedSlot = 0; // hotbar selection (0-7)
        this.listeners = []; // onChange callbacks
    }

    onChange(fn) {
        this.listeners.push(fn);
    }

    _notify() {
        for (const fn of this.listeners) fn(this);
    }

    addItem(itemId, quantity) {
        const def = ItemDefs[itemId];
        if (!def) return 0; // unknown item
        let remaining = quantity;

        // First pass: fill existing stacks
        for (let i = 0; i < this.size && remaining > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.itemId === itemId && slot.quantity < def.maxStack) {
                const space = def.maxStack - slot.quantity;
                const add = Math.min(remaining, space);
                slot.quantity += add;
                remaining -= add;
            }
        }

        // Second pass: fill empty slots
        for (let i = 0; i < this.size && remaining > 0; i++) {
            if (!this.slots[i]) {
                const add = Math.min(remaining, def.maxStack);
                this.slots[i] = { itemId, quantity: add };
                remaining -= add;
            }
        }

        if (remaining < quantity) this._notify();
        return quantity - remaining; // amount actually added
    }

    removeItem(itemId, quantity) {
        let toRemove = quantity;

        // Check if we have enough first
        if (!this.hasItem(itemId, quantity)) return false;

        // Remove from last slots first (preserve hotbar)
        for (let i = this.size - 1; i >= 0 && toRemove > 0; i--) {
            const slot = this.slots[i];
            if (slot && slot.itemId === itemId) {
                const remove = Math.min(toRemove, slot.quantity);
                slot.quantity -= remove;
                toRemove -= remove;
                if (slot.quantity <= 0) this.slots[i] = null;
            }
        }

        this._notify();
        return true;
    }

    hasItem(itemId, quantity = 1) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.itemId === itemId) {
                total += slot.quantity;
                if (total >= quantity) return true;
            }
        }
        return false;
    }

    countItem(itemId) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.itemId === itemId) total += slot.quantity;
        }
        return total;
    }

    getSlot(index) {
        return this.slots[index] || null;
    }

    getSelectedItem() {
        const slot = this.slots[this.selectedSlot];
        return slot ? slot.itemId : null;
    }

    selectSlot(index) {
        if (index >= 0 && index < 8) {
            this.selectedSlot = index;
            this._notify();
        }
    }
}
```

- [ ] **Step 2: Wire Inventory into WorldScene + give starting loadout**

In `WorldScene.js`, add import at top:
```js
import { Inventory } from '../systems/Inventory.js';
```

In `WorldScene.create()`, after player setup, before `this.scene.launch('UI')`:
```js
        // --- Inventory ---
        this.inventory = new Inventory(20);
        // Starting loadout
        this.inventory.addItem('CookedMeat', 3);
        console.log('[WorldScene] Inventory ready, starting items:', this.inventory.countItem('CookedMeat'), 'CookedMeat');
```

Add hotbar number key bindings in `create()`:
```js
        // --- Hotbar keys ---
        for (let i = 0; i < 8; i++) {
            this.input.keyboard.on(`keydown-${i + 1}`, () => {
                this.inventory.selectSlot(i);
                console.log('[Hotbar] Selected slot', i, this.inventory.getSlot(i));
            });
        }
```

- [ ] **Step 3: Verify inventory in console**

Run the game. Open browser console and test:
```js
// Access scene
const scene = game.scene.getScene('World');
scene.inventory.addItem('Wood', 10);
scene.inventory.countItem('Wood'); // 10
scene.inventory.hasItem('Wood', 5); // true
scene.inventory.removeItem('Wood', 3); // true
scene.inventory.countItem('Wood'); // 7
scene.inventory.slots; // inspect all slots
```
Expected: All operations work correctly. Starting loadout has 3 CookedMeat.

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: inventory system with stacking, starting loadout, hotbar keys"
```

---

### Task 5: Resource Nodes + Gathering System

**Files:**
- Create: `game/src/systems/GatherSystem.js`
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Create GatherSystem**

```js
// game/src/systems/GatherSystem.js

const NODE_DEFS = {
    Tree: { textureKey: 'tree', hp: 3, dropItem: 'Wood', dropAmount: 2, respawnTime: 30000 },
    Rock: { textureKey: 'rock', hp: 5, dropItem: 'Stone', dropAmount: 1, respawnTime: 30000 },
};

export class GatherSystem {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory;
        this.nodes = [];         // active node sprites
        this.cooldownUntil = 0;  // timestamp of next allowed gather
        this.interactRadius = 48;
        this.nearestNode = null; // currently highlighted node
    }

    spawnNode(type, tileX, tileY, tileSize) {
        const def = NODE_DEFS[type];
        if (!def) return;

        const x = tileX * tileSize + tileSize / 2;
        const y = tileY * tileSize + tileSize / 2;

        const sprite = this.scene.physics.add.staticSprite(x, y, def.textureKey);
        sprite.setDepth(5);
        sprite.setData('type', type);
        sprite.setData('hp', def.hp);
        sprite.setData('maxHp', def.hp);
        sprite.setData('tileX', tileX);
        sprite.setData('tileY', tileY);
        sprite.setInteractive();

        // Collision with player
        this.scene.physics.add.collider(this.scene.player, sprite);

        this.nodes.push(sprite);
        return sprite;
    }

    update(playerX, playerY, time) {
        // Find nearest interactable node
        let nearest = null;
        let nearestDist = Infinity;

        for (const node of this.nodes) {
            if (!node.active) continue;
            const dist = Phaser.Math.Distance.Between(playerX, playerY, node.x, node.y);
            if (dist < this.interactRadius && dist < nearestDist) {
                nearest = node;
                nearestDist = dist;
            }
        }

        // Update highlight
        if (this.nearestNode && this.nearestNode !== nearest) {
            this.nearestNode.clearTint();
        }
        if (nearest) {
            nearest.setTint(0xddffdd);
        }
        this.nearestNode = nearest;
    }

    tryGather(time) {
        if (!this.nearestNode || !this.nearestNode.active) return false;
        if (time < this.cooldownUntil) return false;

        const node = this.nearestNode;
        const type = node.getData('type');
        const def = NODE_DEFS[type];

        // Check if player has StoneTool equipped for bonus
        const selectedItem = this.inventory.getSelectedItem();
        const hasTool = selectedItem === 'StoneTool';
        const cooldown = hasTool ? 300 : 500;
        const bonusDrop = hasTool ? 1 : 0;

        this.cooldownUntil = time + cooldown;

        // Reduce HP
        const hp = node.getData('hp') - 1;
        node.setData('hp', hp);

        // Grant items
        const amount = def.dropAmount + bonusDrop;
        const added = this.inventory.addItem(def.dropItem, amount);

        // Floating text feedback
        this._floatingText(node.x, node.y - 20, `+${added} ${def.dropItem}`);

        // Hit flash
        node.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (node.active) node.clearTint();
        });

        if (hp <= 0) {
            // Node depleted — hide and schedule respawn
            node.setActive(false).setVisible(false);
            node.body.enable = false;

            this.scene.time.delayedCall(def.respawnTime, () => {
                node.setData('hp', def.maxHp);
                node.setActive(true).setVisible(true);
                node.body.enable = true;
            });

            this.nearestNode = null;
        }

        return true;
    }

    _floatingText(x, y, text) {
        const txt = this.scene.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffff88',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: txt,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy(),
        });
    }
}
```

- [ ] **Step 2: Wire GatherSystem into WorldScene**

In `WorldScene.js`, add import:
```js
import { GatherSystem } from '../systems/GatherSystem.js';
import { RESOURCE_NODES } from '../data/TileConfig.js';
```

In `create()`, after inventory setup:
```js
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
```

In `update()`, add before or after movement code:
```js
        this.gatherSystem.update(this.player.x, this.player.y, this.time.now);
```

- [ ] **Step 3: Verify gathering**

Run the game.
- Walk near a tree (dark green rectangle) — it should get a slight green tint
- Press E — floating "+2 Wood" text appears
- Press E 3 times total on a tree — tree disappears (3 HP)
- Open console: `game.scene.getScene('World').inventory.countItem('Wood')` should show 6
- Wait 30 seconds — tree reappears
- Walk near a rock, press E — "+1 Stone" text appears

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: resource nodes with gathering, HP, respawn, tool bonus, floating text"
```

---

### Task 6: UIScene — Hotbar + Health/Hunger Bars

**Files:**
- Modify: `game/src/scenes/UIScene.js`

- [ ] **Step 1: Implement hotbar and stat bars in UIScene**

Replace `game/src/scenes/UIScene.js` entirely:

```js
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
```

- [ ] **Step 2: Verify hotbar renders**

Run the game.
Expected:
- Bottom center: 8 gray slots numbered 1-8
- Slot 1 has an orange-brown square (CookedMeat) with "3" stack count
- Yellow highlight border on slot 1
- Press 2, 3 etc. — highlight moves
- Top-left: red HP bar and yellow Hunger bar (both full)
- Gather some wood — slot 2 fills with brown icon and count

- [ ] **Step 3: Commit**

```bash
git add game/
git commit -m "feat: UIScene with hotbar, item colors, selection highlight, health/hunger bars"
```

---

### Task 7: Inventory Panel (Tab/I toggle)

**Files:**
- Modify: `game/src/scenes/UIScene.js`
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Add inventory panel rendering to UIScene**

Add these methods to the UIScene class:

```js
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
            Wood: 0x8b6914, Stone: 0x888888, WoodPlank: 0xc4a35a,
            StoneTool: 0xaaaaaa, WoodBlock: 0x8b6914, StoneBlock: 0x666666,
            CookedMeat: 0xcc6633,
        };

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
        const panelH = ROWS * (SLOT + GAP) + GAP + 50;
        const px = (800 - panelW) / 2;
        const py = (600 - panelH) / 2;

        const panelBg = this.add.rectangle(400, 300, panelW, panelH, 0x1a1a2e, 0.95);
        panelBg.setStrokeStyle(2, 0x555555);
        this.inventoryPanel.add(panelBg);

        // Title
        const title = this.add.text(400, py + 14, 'Inventory', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5, 0);
        this.inventoryPanel.add(title);

        // Slots
        for (let i = 0; i < 20; i++) {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const sx = px + 10 + GAP + col * (SLOT + GAP) + SLOT / 2;
            const sy = py + 40 + GAP + row * (SLOT + GAP) + SLOT / 2;

            const slotBg = this.add.rectangle(sx, sy, SLOT, SLOT, 0x222222, 0.9);
            slotBg.setStrokeStyle(1, 0x444444);
            this.inventoryPanel.add(slotBg);

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

                // Item name tooltip on hover area
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
```

- [ ] **Step 2: Wire Tab/I keys in WorldScene**

In `WorldScene.create()`, add:
```js
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
```

- [ ] **Step 3: Verify inventory panel**

Run the game. Gather some wood and stone. Press Tab or I.
Expected:
- Dark overlay appears with 20-slot grid
- CookedMeat in slot 1, gathered resources in slots 2+
- Item names shown in slots
- Press Tab again — panel closes
- Press Esc — panel closes

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: toggleable inventory panel with Tab/I, item display, Esc to close"
```

---

### Task 8: Crafting System + Crafting Panel UI

**Files:**
- Create: `game/src/systems/CraftSystem.js`
- Modify: `game/src/scenes/UIScene.js`
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Create CraftSystem**

```js
// game/src/systems/CraftSystem.js
import { RecipeDefs } from '../data/RecipeDefs.js';

export class CraftSystem {
    constructor(inventory) {
        this.inventory = inventory;
    }

    canCraft(recipeId) {
        const recipe = RecipeDefs[recipeId];
        if (!recipe) return false;
        for (const [itemId, qty] of Object.entries(recipe.inputs)) {
            if (!this.inventory.hasItem(itemId, qty)) return false;
        }
        return true;
    }

    craft(recipeId) {
        const recipe = RecipeDefs[recipeId];
        if (!recipe || !this.canCraft(recipeId)) return false;

        // Consume inputs
        for (const [itemId, qty] of Object.entries(recipe.inputs)) {
            this.inventory.removeItem(itemId, qty);
        }

        // Grant output
        const added = this.inventory.addItem(recipe.output, recipe.outputQty);
        console.log(`[Craft] ${recipe.displayName}: +${added} ${recipe.output}`);
        return true;
    }

    getRecipes() {
        return Object.entries(RecipeDefs).map(([id, recipe]) => ({
            id,
            ...recipe,
            craftable: this.canCraft(id),
        }));
    }
}
```

- [ ] **Step 2: Wire CraftSystem into WorldScene**

In `WorldScene.js`, add import:
```js
import { CraftSystem } from '../systems/CraftSystem.js';
```

In `create()`, after gather system setup:
```js
        // --- Craft System ---
        this.craftSystem = new CraftSystem(this.inventory);
```

Add C key binding:
```js
        this.input.keyboard.on('keydown-C', () => {
            this.scene.get('UI').toggleCrafting();
        });
```

- [ ] **Step 3: Add crafting panel to UIScene**

Add these methods to UIScene:

```js
    toggleCrafting() {
        if (this.inventoryOpen) return; // don't open both
        this.craftingOpen = !this.craftingOpen;
        if (this.craftingOpen) {
            this._showCraftingPanel();
        } else {
            this._hideCraftingPanel();
        }
    }

    _showCraftingPanel() {
        const craftSystem = this.worldScene.craftSystem;
        this.craftingPanel = this.add.container(0, 0).setDepth(300);

        // Dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
        this.craftingPanel.add(overlay);

        // Panel background
        const panelW = 360;
        const panelH = 320;
        const px = (800 - panelW) / 2;
        const py = (600 - panelH) / 2;

        const panelBg = this.add.rectangle(400, 300, panelW, panelH, 0x1a1a2e, 0.95);
        panelBg.setStrokeStyle(2, 0x555555);
        this.craftingPanel.add(panelBg);

        // Title
        const title = this.add.text(400, py + 14, 'Crafting', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5, 0);
        this.craftingPanel.add(title);

        // Recipe list
        const recipes = craftSystem.getRecipes();
        recipes.forEach((recipe, i) => {
            const ry = py + 50 + i * 58;

            // Recipe row background
            const rowColor = recipe.craftable ? 0x2a3a2a : 0x2a2a2a;
            const row = this.add.rectangle(400, ry + 20, panelW - 30, 50, rowColor, 0.9);
            row.setStrokeStyle(1, recipe.craftable ? 0x4ade80 : 0x444444);
            this.craftingPanel.add(row);

            // Recipe name
            const nameColor = recipe.craftable ? '#ffffff' : '#666666';
            const name = this.add.text(px + 24, ry + 6, recipe.displayName, {
                fontSize: '14px', fontFamily: 'Arial', color: nameColor, fontStyle: 'bold',
            });
            this.craftingPanel.add(name);

            // Inputs text
            const inputStr = Object.entries(recipe.inputs).map(([id, qty]) => `${qty} ${id}`).join(', ');
            const inputTxt = this.add.text(px + 24, ry + 24, `Needs: ${inputStr}`, {
                fontSize: '11px', fontFamily: 'Arial', color: recipe.craftable ? '#aaaaaa' : '#555555',
            });
            this.craftingPanel.add(inputTxt);

            // Output text
            const outputTxt = this.add.text(px + panelW - 24, ry + 14, `→ ${recipe.outputQty} ${recipe.output}`, {
                fontSize: '11px', fontFamily: 'Arial', color: recipe.craftable ? '#4ade80' : '#555555',
            }).setOrigin(1, 0);
            this.craftingPanel.add(outputTxt);

            // Click to craft
            if (recipe.craftable) {
                row.setInteractive({ useHandCursor: true });
                row.on('pointerdown', () => {
                    craftSystem.craft(recipe.id);
                    // Refresh panel
                    this._hideCraftingPanel();
                    this._showCraftingPanel();
                });
                row.on('pointerover', () => row.setFillStyle(0x3a4a3a, 0.9));
                row.on('pointerout', () => row.setFillStyle(rowColor, 0.9));
            }
        });
    }

    _hideCraftingPanel() {
        if (this.craftingPanel) {
            this.craftingPanel.destroy();
            this.craftingPanel = null;
        }
    }
```

Also update the `toggleInventory` and Esc handler: ensure `toggleCrafting` is defined (it is now). No changes needed.

- [ ] **Step 4: Verify crafting**

Run the game. Gather 4+ wood. Press C.
Expected:
- Crafting panel shows 4 recipes
- "Wood Plank" is green/highlighted (you have enough Wood)
- Other recipes are grayed out
- Click "Wood Plank" — 2 Wood consumed, 4 WoodPlank added to inventory
- Panel refreshes, showing updated craftability
- Press C or Esc — panel closes

- [ ] **Step 5: Commit**

```bash
git add game/
git commit -m "feat: crafting system with recipe validation, crafting panel UI"
```

---

### Task 9: Building System — Placement and Removal

**Files:**
- Create: `game/src/systems/BuildSystem.js`
- Modify: `game/src/scenes/WorldScene.js`

- [ ] **Step 1: Create BuildSystem**

```js
// game/src/systems/BuildSystem.js
import { ItemDefs } from '../data/ItemDefs.js';
import { MAP_DATA, TILE_SIZE, TileProps } from '../data/TileConfig.js';

export class BuildSystem {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory;
        this.placedBlocks = [];   // { sprite, tileX, tileY, itemId }
        this.preview = null;      // ghost preview sprite
        this.active = false;      // whether build mode is on
        this.currentItemId = null;
    }

    enterBuildMode(itemId) {
        const def = ItemDefs[itemId];
        if (!def || def.category !== 'Buildable') return;
        if (!this.inventory.hasItem(itemId, 1)) return;

        this.active = true;
        this.currentItemId = itemId;

        if (!this.preview) {
            this.preview = this.scene.add.image(0, 0, 'ghost');
            this.preview.setDepth(50);
            this.preview.setAlpha(0.5);
        }
        this.preview.setVisible(true);
        this.preview.setTexture(def.buildModelKey || 'ghost');
    }

    exitBuildMode() {
        this.active = false;
        this.currentItemId = null;
        if (this.preview) this.preview.setVisible(false);
    }

    update(pointer, camera) {
        if (!this.active || !this.preview) return;

        // Get world position of mouse
        const worldX = pointer.x + camera.scrollX;
        const worldY = pointer.y + camera.scrollY;

        // Snap to tile grid
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);
        const snapX = tileX * TILE_SIZE + TILE_SIZE / 2;
        const snapY = tileY * TILE_SIZE + TILE_SIZE / 2;

        this.preview.setPosition(snapX, snapY);

        // Check validity
        const valid = this._canPlace(tileX, tileY);
        this.preview.setTint(valid ? 0x00ff00 : 0xff0000);
        this.preview.setAlpha(valid ? 0.6 : 0.4);
    }

    tryPlace(pointer, camera) {
        if (!this.active) return false;

        const worldX = pointer.x + camera.scrollX;
        const worldY = pointer.y + camera.scrollY;
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);

        if (!this._canPlace(tileX, tileY)) return false;
        if (!this.inventory.removeItem(this.currentItemId, 1)) return false;

        const snapX = tileX * TILE_SIZE + TILE_SIZE / 2;
        const snapY = tileY * TILE_SIZE + TILE_SIZE / 2;

        const def = ItemDefs[this.currentItemId];
        const sprite = this.scene.physics.add.staticSprite(snapX, snapY, def.buildModelKey || 'ghost');
        sprite.setDepth(4);
        sprite.refreshBody();

        // Collide with player
        this.scene.physics.add.collider(this.scene.player, sprite);

        const block = { sprite, tileX, tileY, itemId: this.currentItemId };
        this.placedBlocks.push(block);

        // Exit build mode if no more items
        if (!this.inventory.hasItem(this.currentItemId, 1)) {
            this.exitBuildMode();
        }

        return true;
    }

    tryRemove(playerX, playerY, pointer, camera) {
        const worldX = pointer.x + camera.scrollX;
        const worldY = pointer.y + camera.scrollY;

        for (let i = this.placedBlocks.length - 1; i >= 0; i--) {
            const block = this.placedBlocks[i];
            const bx = block.tileX * TILE_SIZE + TILE_SIZE / 2;
            const by = block.tileY * TILE_SIZE + TILE_SIZE / 2;

            // Check if click is on this block
            const clickDist = Phaser.Math.Distance.Between(worldX, worldY, bx, by);
            if (clickDist > TILE_SIZE) continue;

            // Check if player is close enough
            const playerDist = Phaser.Math.Distance.Between(playerX, playerY, bx, by);
            if (playerDist > 48 + TILE_SIZE) continue;

            // Remove block, return item
            block.sprite.destroy();
            this.placedBlocks.splice(i, 1);
            this.inventory.addItem(block.itemId, 1);
            return true;
        }
        return false;
    }

    _canPlace(tileX, tileY) {
        // Out of bounds
        if (tileX < 0 || tileY < 0 || tileX >= MAP_DATA[0].length || tileY >= MAP_DATA.length) return false;

        // Non-walkable tile
        const tileId = MAP_DATA[tileY][tileX];
        if (!TileProps[tileId].walkable) return false;

        // Player is standing here
        const playerTileX = Math.floor(this.scene.player.x / TILE_SIZE);
        const playerTileY = Math.floor(this.scene.player.y / TILE_SIZE);
        if (tileX === playerTileX && tileY === playerTileY) return false;

        // Already a block here
        for (const block of this.placedBlocks) {
            if (block.tileX === tileX && block.tileY === tileY) return false;
        }

        // Check resource nodes
        const gatherSystem = this.scene.gatherSystem;
        if (gatherSystem) {
            for (const node of gatherSystem.nodes) {
                if (!node.active) continue;
                const nodeTX = node.getData('tileX');
                const nodeTY = node.getData('tileY');
                if (tileX === nodeTX && tileY === nodeTY) return false;
            }
        }

        return true;
    }
}
```

- [ ] **Step 2: Wire BuildSystem into WorldScene**

In `WorldScene.js`, add import:
```js
import { BuildSystem } from '../systems/BuildSystem.js';
```

In `create()`, after craft system:
```js
        // --- Build System ---
        this.buildSystem = new BuildSystem(this, this.inventory);

        // Enter build mode when selecting a Buildable item
        this.inventory.onChange(() => {
            const selectedItem = this.inventory.getSelectedItem();
            if (selectedItem && ItemDefs[selectedItem]?.category === 'Buildable') {
                this.buildSystem.enterBuildMode(selectedItem);
            } else if (this.buildSystem.active) {
                this.buildSystem.exitBuildMode();
            }
        });
```

Add import for ItemDefs at top of WorldScene.js:
```js
import { ItemDefs } from '../data/ItemDefs.js';
```

Update the existing pointerdown handler — replace the click-to-gather one with a unified handler:
```js
        // --- Mouse input ---
        this.input.on('pointerdown', (pointer) => {
            // Don't process clicks if UI panels are open
            const ui = this.scene.get('UI');
            if (ui.inventoryOpen || ui.craftingOpen) return;

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
```

Also remove the earlier separate `this.input.on('pointerdown', ...)` for gathering if it exists — replace it with this unified one.

Add Esc to exit build mode — update the existing Esc handler:
```js
        this.input.keyboard.on('keydown-ESC', () => {
            const ui = this.scene.get('UI');
            if (ui.craftingOpen) { ui.toggleCrafting(); return; }
            if (ui.inventoryOpen) { ui.toggleInventory(); return; }
            if (this.buildSystem.active) { this.buildSystem.exitBuildMode(); return; }
        });
```

In `update()`, add:
```js
        this.buildSystem.update(this.input.activePointer, this.cameras.main);
```

- [ ] **Step 3: Verify building**

Run the game. Gather wood → craft Wood Planks → craft Wood Blocks. Press 1-8 to find the WoodBlock slot, select it.
Expected:
- Ghost preview follows mouse, snapped to grid
- Green on valid tiles, red on water/trees/player position
- Left click places a brown block — item consumed from hotbar
- Block has collision (player can't walk through)
- Right click near a placed block — block removed, item returned
- Esc exits build mode

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: building system with grid-snap placement, validation, removal"
```

---

### Task 10: Survival System — Hunger

**Files:**
- Create: `game/src/systems/SurvivalSystem.js`
- Modify: `game/src/scenes/WorldScene.js`
- Modify: `game/src/scenes/UIScene.js`

- [ ] **Step 1: Create SurvivalSystem**

```js
// game/src/systems/SurvivalSystem.js
import { ItemDefs } from '../data/ItemDefs.js';

export class SurvivalSystem {
    constructor(inventory) {
        this.inventory = inventory;
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;

        this.hungerRate = 1;          // hunger lost per tick
        this.hungerInterval = 5000;   // ms between hunger ticks
        this.lastHungerTick = 0;

        this.starveDamage = 1;        // HP lost per tick when starving
        this.starveInterval = 3000;   // ms between starve ticks
        this.lastStarveTick = 0;

        this.lowHungerThreshold = 25; // below this = slow
        this.speedMultiplier = 1;     // set by update
    }

    update(time) {
        // Hunger depletion
        if (time - this.lastHungerTick >= this.hungerInterval) {
            this.lastHungerTick = time;
            this.hunger = Math.max(0, this.hunger - this.hungerRate);
        }

        // Starvation damage
        if (this.hunger <= 0 && time - this.lastStarveTick >= this.starveInterval) {
            this.lastStarveTick = time;
            this.health = Math.max(0, this.health - this.starveDamage);
        }

        // Speed penalty
        this.speedMultiplier = this.hunger < this.lowHungerThreshold ? 0.7 : 1;
    }

    tryEat(itemId) {
        const def = ItemDefs[itemId];
        if (!def || !def.hungerRestore) return false;
        if (!this.inventory.hasItem(itemId, 1)) return false;

        this.inventory.removeItem(itemId, 1);
        this.hunger = Math.min(this.maxHunger, this.hunger + def.hungerRestore);
        console.log(`[Survival] Ate ${itemId}, hunger: ${this.hunger}`);
        return true;
    }

    isDead() {
        return this.health <= 0;
    }
}
```

- [ ] **Step 2: Wire SurvivalSystem into WorldScene**

In `WorldScene.js`, add import:
```js
import { SurvivalSystem } from '../systems/SurvivalSystem.js';
```

In `create()`, after build system:
```js
        // --- Survival System ---
        this.survivalSystem = new SurvivalSystem(this.inventory);
        this.survivalSystem.lastHungerTick = this.time.now;
        this.survivalSystem.lastStarveTick = this.time.now;
```

Update the E key handler to check for eating first:
```js
        this.input.keyboard.on('keydown-E', () => {
            // Try to eat if holding a consumable
            const selectedItem = this.inventory.getSelectedItem();
            if (selectedItem && ItemDefs[selectedItem]?.category === 'Consumable') {
                if (this.survivalSystem.tryEat(selectedItem)) return;
            }
            // Otherwise try to gather
            this.gatherSystem.tryGather(this.time.now);
        });
```

In `update()`, add survival update and apply speed multiplier:
```js
        // Survival
        this.survivalSystem.update(this.time.now);
        const speed = this.moveSpeed * this.survivalSystem.speedMultiplier;
```

Change the movement code to use `speed` instead of `this.moveSpeed`:
```js
        this.player.setVelocity(vx * speed, vy * speed);
```

Update UIScene survival bars each frame — add to WorldScene `update()`:
```js
        // Update UI bars
        const ui = this.scene.get('UI');
        if (ui && ui.updateSurvivalBars) {
            ui.updateSurvivalBars(
                this.survivalSystem.health, this.survivalSystem.maxHealth,
                this.survivalSystem.hunger, this.survivalSystem.maxHunger
            );
        }
```

- [ ] **Step 3: Verify survival system**

Run the game.
Expected:
- Hunger bar slowly decreases over time (1 point per 5 seconds)
- When hunger < 25: movement becomes noticeably slower
- When hunger = 0: health starts decreasing (1 per 3 seconds)
- Select CookedMeat in hotbar (slot 1), press E — hunger bar increases by 30
- Health/hunger bars in top-left update in real-time

- [ ] **Step 4: Commit**

```bash
git add game/
git commit -m "feat: survival system with hunger depletion, starvation, food consumption"
```

---

### Task 11: Final Polish + Integration Verification

**Files:**
- Modify: `game/src/scenes/WorldScene.js` (minor cleanup)

- [ ] **Step 1: Add death state handling**

In WorldScene `update()`, add at the top:
```js
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
```

- [ ] **Step 2: Full integration test**

Run the game and play through the complete loop:
1. Spawn — see blue player, grass world, trees, rocks, UI bars
2. Walk with WASD — smooth movement, camera follows
3. Walk near tree, press E 3 times — tree disappears, "+2 Wood" appears, inventory updates
4. Walk near rock, press E 5 times — rock disappears, "+1 Stone" appears
5. Press C — crafting panel opens, "Wood Plank" is craftable
6. Click "Wood Plank" — crafted, 4 planks in inventory
7. Craft more planks, then craft "Wood Block"
8. Press C to close, select WoodBlock in hotbar
9. Ghost preview follows mouse — green on valid, red on water
10. Left click to place — block appears, has collision
11. Right click placed block — removed, item returned
12. Press Tab — inventory panel shows all items
13. Watch hunger bar deplete over time
14. Select CookedMeat, press E — hunger restores
15. Verify hunger < 25 slows movement
16. Verify starvation at 0 hunger damages health

- [ ] **Step 3: Commit**

```bash
git add game/
git commit -m "feat: death state, complete survival crafting prototype"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Project skeleton, data modules, placeholder scenes | index.html, ItemDefs, RecipeDefs, 3 scenes |
| 2 | TileConfig, generated textures, tilemap rendering | TileConfig, BootScene, WorldScene |
| 3 | Player movement, WASD, collision, camera follow | WorldScene |
| 4 | Inventory system, stacking, hotbar keys, starting loadout | Inventory, WorldScene |
| 5 | Resource nodes, gathering, HP, respawn, tool bonus | GatherSystem, WorldScene |
| 6 | Hotbar UI, health/hunger bars, selection highlight | UIScene |
| 7 | Inventory panel toggle (Tab/I) | UIScene, WorldScene |
| 8 | Craft system, crafting panel, recipe validation | CraftSystem, UIScene, WorldScene |
| 9 | Build system, grid-snap placement, validation, removal | BuildSystem, WorldScene |
| 10 | Survival system, hunger, starvation, food consumption | SurvivalSystem, WorldScene, UIScene |
| 11 | Death state, full integration test | WorldScene |
