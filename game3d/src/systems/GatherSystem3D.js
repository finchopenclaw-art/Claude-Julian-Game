// GatherSystem3D.js — Handles gathering from resource nodes in 3D
import * as THREE from 'three';

const NODE_DEFS = {
    Tree: { hp: 3, dropItem: 'Wood', dropAmount: 2, respawnTime: 30000 },
    Rock: { hp: 5, dropItem: 'Stone', dropAmount: 1, respawnTime: 30000 },
    BerryBush: { hp: 2, dropItem: 'Berry', dropAmount: 3, respawnTime: 15000 },
    CoalOre: { hp: 4, dropItem: 'Coal', dropAmount: 2, respawnTime: 45000 },
    IronOre: { hp: 6, dropItem: 'IronOre', dropAmount: 1, respawnTime: 60000 },
};

export class GatherSystem3D {
    constructor(inventory, resourceMeshes) {
        this.inventory = inventory;
        this.resourceMeshes = resourceMeshes; // Three.js groups from WorldRenderer
        this.cooldownUntil = 0;
        this.interactDist = 4;

        // Initialize HP on each node
        for (const group of this.resourceMeshes) {
            const type = group.userData.nodeData.type;
            const def = NODE_DEFS[type];
            group.userData.hp = def.hp;
            group.userData.maxHp = def.hp;
            group.userData.depleted = false;
        }
    }

    getNearestNode(playerPos) {
        let nearest = null;
        let nearestDist = Infinity;

        for (const group of this.resourceMeshes) {
            if (group.userData.depleted) continue;
            const dist = playerPos.distanceTo(group.position);
            if (dist < this.interactDist && dist < nearestDist) {
                nearest = group;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    tryGather(playerPos, time) {
        if (time < this.cooldownUntil) return null;

        const node = this.getNearestNode(playerPos);
        if (!node) return null;

        const type = node.userData.nodeData.type;
        const def = NODE_DEFS[type];

        // Check if player has a tool equipped for bonus
        const selectedItem = this.inventory.getSelectedItem();
        const hasIronTool = selectedItem === 'IronTool';
        const hasStoneTool = selectedItem === 'StoneTool';
        const cooldown = hasIronTool ? 200 : hasStoneTool ? 300 : 500;
        const bonusDrop = hasIronTool ? 2 : hasStoneTool ? 1 : 0;

        this.cooldownUntil = time + cooldown;

        // Reduce HP
        node.userData.hp -= 1;

        // Grant items
        const amount = def.dropAmount + bonusDrop;
        const added = this.inventory.addItem(def.dropItem, amount);

        // Hit flash — briefly scale the node
        const origScale = node.scale.clone();
        node.scale.multiplyScalar(0.8);
        setTimeout(() => {
            if (!node.userData.depleted) node.scale.copy(origScale);
        }, 100);

        if (node.userData.hp <= 0) {
            // Deplete node
            node.userData.depleted = true;
            node.visible = false;

            // Respawn timer
            setTimeout(() => {
                node.userData.hp = node.userData.maxHp;
                node.userData.depleted = false;
                node.visible = true;
            }, def.respawnTime);
        }

        return { item: def.dropItem, amount: added };
    }
}
