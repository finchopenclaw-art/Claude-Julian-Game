// game/src/data/ItemDefs.js
export const ItemDefs = {
    Wood:       { displayName: 'Wood',       maxStack: 64, category: 'Resource' },
    Stone:      { displayName: 'Stone',      maxStack: 64, category: 'Resource' },
    WoodPlank:  { displayName: 'Wood Plank', maxStack: 64, category: 'Resource' },
    Stick:      { displayName: 'Stick',      maxStack: 64, category: 'Resource' },
    StoneTool:  { displayName: 'Stone Tool', maxStack: 1,  category: 'Tool' },
    WoodBlock:  { displayName: 'Wood Block', maxStack: 64, category: 'Buildable', buildModelKey: 'woodBlock' },
    StoneBlock: { displayName: 'Stone Block',maxStack: 64, category: 'Buildable', buildModelKey: 'stoneBlock' },
    WoodDoor:   { displayName: 'Wood Door',  maxStack: 16, category: 'Buildable', buildModelKey: 'woodDoor' },
    Fence:      { displayName: 'Fence',      maxStack: 64, category: 'Buildable', buildModelKey: 'fence' },
    Torch:      { displayName: 'Torch',      maxStack: 32, category: 'Buildable', buildModelKey: 'torch' },
    Ladder:     { displayName: 'Ladder',     maxStack: 16, category: 'Buildable', buildModelKey: 'ladder' },
    StoneBrick: { displayName: 'Stone Brick',maxStack: 64, category: 'Buildable', buildModelKey: 'stoneBrick' },
    CookedMeat: { displayName: 'Cooked Meat',maxStack: 16, category: 'Consumable', hungerRestore: 30 },
    Berry:      { displayName: 'Berry',      maxStack: 32, category: 'Consumable', hungerRestore: 10 },
    BerryPie:   { displayName: 'Berry Pie',  maxStack: 8,  category: 'Consumable', hungerRestore: 50 },
};
