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
