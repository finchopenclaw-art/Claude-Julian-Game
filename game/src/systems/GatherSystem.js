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
