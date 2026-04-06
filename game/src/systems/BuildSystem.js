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
