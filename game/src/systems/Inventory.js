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
