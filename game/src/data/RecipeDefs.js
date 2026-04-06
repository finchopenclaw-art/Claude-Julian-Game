// game/src/data/RecipeDefs.js
export const RecipeDefs = {
    CraftWoodPlank: {
        displayName: 'Wood Plank',
        inputs: { Wood: 2 },
        output: 'WoodPlank',
        outputQty: 4,
    },
    CraftStoneTool: {
        displayName: 'Stone Tool',
        inputs: { Stone: 5, Wood: 2 },
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
};
