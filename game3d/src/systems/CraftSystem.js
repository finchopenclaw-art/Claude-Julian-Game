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
