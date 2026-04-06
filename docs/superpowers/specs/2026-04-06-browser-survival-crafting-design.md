# Browser Survival Crafting Game — Design Spec

## Overview

A 2D top-down browser-based survival crafting game built with Phaser 3. Single-player, no server required, deployable as a static site. The gameplay loop: gather resources → manage inventory → craft items → place structures → survive hunger pressure.

Inspired by the original Roblox survival crafting concept, adapted for browser with faster iteration and zero tooling friction.

## Tech Stack

- **Engine:** Phaser 3 (loaded from CDN)
- **Language:** Vanilla JavaScript (ES modules)
- **Build step:** None — open `index.html` directly or use a simple dev server
- **Art:** Colored rectangles for prototype (no external art assets required)
- **Deployment:** Static files — any web server, Netlify, GitHub Pages, etc.

## Architecture

### Three-layer design

1. **Scenes** — Phaser scenes handle rendering and player input
2. **Systems** — ES module classes handle game logic (inventory, crafting, building, survival)
3. **Data** — Pure data objects define items, recipes, and tile configuration

### File Structure

```
game/
  ├── index.html                 — entry point, loads Phaser CDN
  ├── src/
  │   ├── scenes/
  │   │   ├── BootScene.js       — load assets, transition to WorldScene
  │   │   ├── WorldScene.js      — main gameplay scene
  │   │   └── UIScene.js         — HUD overlay (runs parallel to WorldScene)
  │   ├── systems/
  │   │   ├── Inventory.js       — item storage, stacking, slot management
  │   │   ├── GatherSystem.js    — resource node interaction and rewards
  │   │   ├── CraftSystem.js     — recipe validation and crafting
  │   │   ├── BuildSystem.js     — placement preview, validation, block management
  │   │   └── SurvivalSystem.js  — hunger depletion, consequences, consumption
  │   └── data/
  │       ├── ItemDefs.js        — item database
  │       ├── RecipeDefs.js      — crafting recipe database
  │       └── TileConfig.js      — map layout and tile type definitions
  └── assets/                    — sprites, tilesheets (generated programmatically for prototype)
```

### Scene Responsibilities

- **BootScene:** Creates colored-rectangle textures programmatically (no asset files needed). Transitions to WorldScene + UIScene.
- **WorldScene:** Renders the tilemap, player, resource nodes, placed buildings. Handles player movement, gathering input, build placement. Owns all game systems.
- **UIScene:** Overlay scene running in parallel. Renders hotbar, inventory panel, crafting panel, hunger/health bars. Listens to system events for updates.

## World & Tilemap

- **Tile size:** 32x32 pixels
- **Map size:** 50x50 tiles (1600x1600 pixels)
- **Tile types:** Grass (walkable), Dirt (walkable), Sand (walkable), Water (blocked)
- **Rendering:** Phaser tilemap layer from a 2D array defined in `TileConfig.js`
- **Resource nodes:** Phaser sprites placed on top of the tilemap, not tiles themselves
- **Camera:** Follows player with smooth lerp, clamped to map boundaries

### Map Layout (TileConfig.js)

A hand-authored 2D number array. Tile type IDs:
- 0 = Grass
- 1 = Dirt
- 2 = Sand
- 3 = Water

Resource node spawn positions are defined as a separate array of `{ type, x, y }` objects in the same file.

## Player & Movement

- **Sprite:** Colored rectangle (24x24 pixels, blue)
- **Movement:** WASD, 8-directional, constant speed (~150 px/s)
- **Collision:** Blocked by water tiles, resource nodes, and placed buildings
- **Interaction radius:** 48 pixels — determines what the player can gather or interact with
- **Camera:** Smooth follow with lerp, clamped to map edges
- **No animation** for prototype — static colored square

## Gathering System

### Resource Nodes

| Node | Sprite Color | HP | Drop Item | Drop Amount |
|------|-------------|-----|-----------|-------------|
| Tree | Dark green rectangle | 3 | Wood | 2 per hit |
| Rock | Gray rectangle | 5 | Stone | 1 per hit |

### Tool Effect

If the player has a **StoneTool** in their selected hotbar slot while gathering:
- Gather cooldown reduced from 0.5s to 0.3s
- Drop amount increased by +1 per hit
- The tool is not consumed (infinite durability for prototype)

### Interaction Flow

1. Player walks within 48px of a resource node
2. Node gets a visual highlight (tint change or outline)
3. Player presses **E** or clicks the node
4. 0.5-second cooldown between hits
5. Node HP decreases by 1
6. Items added to inventory
7. Floating text feedback: "+2 Wood"
8. When HP reaches 0: node disappears, respawns at same position after 30 seconds

## Inventory System

- **20 slots** total
- Items stack up to their `maxStack` value (from ItemDefs)
- First 8 slots are the **hotbar** (always visible at bottom of screen)
- **Number keys 1-8** select a hotbar slot
- Selected slot has a highlight border
- Selecting a Buildable item enters build-placement mode
- Press **Tab** or **I** to toggle the full 20-slot inventory panel
- Click a slot to select it

### Inventory Operations

- `addItem(itemId, quantity)` — adds to first available matching stack, then empty slot
- `removeItem(itemId, quantity)` — removes from inventory, returns success/failure
- `hasItem(itemId, quantity)` — checks if player has enough of an item
- `getSlot(index)` — returns `{ itemId, quantity }` or `null`

## Crafting System

### Recipes (from RecipeDefs.js)

| Recipe ID | Display Name | Inputs | Output | Qty |
|-----------|-------------|--------|--------|-----|
| CraftWoodPlank | Wood Plank | 2 Wood | WoodPlank | 4 |
| CraftStoneTool | Stone Tool | 5 Stone, 2 Wood | StoneTool | 1 |
| CraftWoodBlock | Wood Block | 4 WoodPlank | WoodBlock | 2 |
| CraftStoneBlock | Stone Block | 6 Stone | StoneBlock | 2 |

### Interaction Flow

1. Player presses **C** to open crafting panel
2. Panel shows all recipes with required materials
3. Recipes with insufficient materials are grayed out
4. Player clicks a craftable recipe
5. Input items consumed from inventory
6. Output items added to inventory
7. Instant crafting (no delay for prototype)
8. Panel closes on **C** or **Esc**

## Building System

### Placement Flow

1. Player selects a Buildable item in hotbar (e.g., WoodBlock)
2. Ghost preview appears at mouse position, snapped to 32x32 tile grid
3. **Green** preview = valid placement
4. **Red** preview = blocked (water tile, existing object, player position)
5. **Left click** to place — consumes 1 item from stack, creates a solid block
6. **Esc** or selecting a different slot cancels placement mode

### Removal Flow

1. Player right-clicks a placed block within interaction range (48px)
2. Block is removed from the world
3. Corresponding item returned to inventory (1 block → 1 item)

### Validation Rules

- Cannot place on water tiles
- Cannot place on tiles occupied by resource nodes or other buildings
- Cannot place on the tile the player is standing on
- Placed blocks have collision — player cannot walk through them

## Survival System — Hunger

### Stats

| Stat | Start Value | Max Value |
|------|------------|-----------|
| Health | 100 | 100 |
| Hunger | 100 | 100 |

### Hunger Depletion

- Hunger decreases by 1 every 5 seconds
- At hunger < 25: player movement speed reduced by 30%
- At hunger = 0: player loses 1 HP every 3 seconds
- No natural health regeneration in prototype

### Food Consumption

- Select CookedMeat in hotbar, press **E** to eat
- Restores 30 hunger (capped at 100)
- Consumes 1 from stack

### Starting Loadout

Player spawns with:
- 3x CookedMeat (enough to learn the hunger mechanic without instant death)

## Item Definitions (ItemDefs.js)

| Item ID | Display Name | Max Stack | Category |
|---------|-------------|-----------|----------|
| Wood | Wood | 64 | Resource |
| Stone | Stone | 64 | Resource |
| WoodPlank | Wood Plank | 64 | Resource |
| StoneTool | Stone Tool | 1 | Tool |
| WoodBlock | Wood Block | 64 | Buildable |
| StoneBlock | Stone Block | 64 | Buildable |
| CookedMeat | Cooked Meat | 16 | Consumable |

## UI Layout

### HUD (always visible)

- **Top-left:** Health bar (red) and Hunger bar (yellow), stacked vertically
- **Bottom-center:** Hotbar — 8 slots with item icons and stack counts, selected slot highlighted

### Panels (toggled)

- **Inventory panel (Tab/I):** 20-slot grid, centered on screen, semi-transparent dark background
- **Crafting panel (C):** Recipe list on left, result preview on right, centered on screen

### Visual Feedback

- Floating damage/gather text near resource nodes
- Slot highlight on selected hotbar item
- Resource node tint when player is in interaction range
- Build preview ghost (green/red)

## Controls Summary

| Key | Action |
|-----|--------|
| WASD | Move (8-directional) |
| E | Gather / Eat food |
| 1-8 | Select hotbar slot |
| Tab / I | Toggle inventory |
| C | Toggle crafting panel |
| Left Click | Place block (in build mode) / Click UI |
| Right Click | Remove placed block (when nearby) |
| Esc | Close panel / Cancel build mode |

## Scope Exclusions (Prototype)

These are explicitly **not** included in the first version:
- Combat / enemies / animals
- Farming / growing
- Quests / objectives
- Weather / day-night cycle
- Advanced terrain generation
- Save/load persistence
- Multiplayer
- Monetization
- Sound / music
- Animated sprites

## Future Expansion Path

After the prototype loop works:
1. Add save/load (localStorage)
2. Add simple sprite art to replace colored rectangles
3. Add a day/night cycle
4. Add enemies and basic combat
5. Add more resources, recipes, and building types
6. Consider multiplayer (WebSocket server) or Roblox port
