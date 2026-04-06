// game/src/data/ItemDefs.js
export const ItemDefs = {
    Wood:       { displayName: 'Wood',       maxStack: 64, category: 'Resource' },
    Stone:      { displayName: 'Stone',      maxStack: 64, category: 'Resource' },
    WoodPlank:  { displayName: 'Wood Plank', maxStack: 64, category: 'Resource' },
    StoneTool:  { displayName: 'Stone Tool', maxStack: 1,  category: 'Tool' },
    WoodBlock:  { displayName: 'Wood Block', maxStack: 64, category: 'Buildable', buildModelKey: 'woodBlock' },
    StoneBlock: { displayName: 'Stone Block',maxStack: 64, category: 'Buildable', buildModelKey: 'stoneBlock' },
    CookedMeat: { displayName: 'Cooked Meat',maxStack: 16, category: 'Consumable', hungerRestore: 30 },
    Berry:      { displayName: 'Berry',      maxStack: 32, category: 'Consumable', hungerRestore: 10 },
};
