// game/src/data/RecipeDefs.js
export const RecipeDefs = {
    CraftWoodPlank: {
        displayName: 'Wood Plank',
        inputs: { Wood: 2 },
        output: 'WoodPlank',
        outputQty: 4,
    },
    CraftStick: {
        displayName: 'Stick',
        inputs: { Wood: 1 },
        output: 'Stick',
        outputQty: 4,
    },
    CraftStoneTool: {
        displayName: 'Stone Tool',
        inputs: { Stone: 3, Stick: 2 },
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
    CraftWoodDoor: {
        displayName: 'Wood Door',
        inputs: { WoodPlank: 6 },
        output: 'WoodDoor',
        outputQty: 1,
    },
    CraftFence: {
        displayName: 'Fence',
        inputs: { Stick: 4, WoodPlank: 2 },
        output: 'Fence',
        outputQty: 4,
    },
    CraftTorch: {
        displayName: 'Torch',
        inputs: { Stick: 1, Wood: 1 },
        output: 'Torch',
        outputQty: 2,
    },
    CraftLadder: {
        displayName: 'Ladder',
        inputs: { Stick: 6 },
        output: 'Ladder',
        outputQty: 2,
    },
    CraftStoneBrick: {
        displayName: 'Stone Brick',
        inputs: { Stone: 4 },
        output: 'StoneBrick',
        outputQty: 4,
    },
    CraftBerryPie: {
        displayName: 'Berry Pie',
        inputs: { Berry: 8, Wood: 1 },
        output: 'BerryPie',
        outputQty: 1,
    },
    CookMeat: {
        displayName: 'Cooked Meat',
        inputs: { RawMeat: 1, Wood: 1 },
        output: 'CookedMeat',
        outputQty: 1,
    },
};
