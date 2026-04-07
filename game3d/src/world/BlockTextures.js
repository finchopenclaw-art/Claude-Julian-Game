// BlockTextures.js — Generates procedural pixel-art textures for blocks
import * as THREE from 'three';
import { BLOCK } from './WorldData.js';

const TEX_SIZE = 16;

function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    return canvas;
}

function hexToRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

// Multi-shade noise — pass an array of [color, weight] pairs
function multiNoise(ctx, shades) {
    const totalWeight = shades.reduce((s, sh) => s + sh[1], 0);
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
        let r = Math.random() * totalWeight;
        let chosen = shades[0][0];
        for (const [color, weight] of shades) {
            r -= weight;
            if (r <= 0) { chosen = color; break; }
        }
        const [cr, cg, cb] = hexToRGB(chosen);
        imgData.data[i] = cr;
        imgData.data[i + 1] = cg;
        imgData.data[i + 2] = cb;
        imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}

function px(ctx, x, y, color) {
    const [r, g, b] = hexToRGB(color);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 1, 1);
}

function makeTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

function grassTop() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x4a7c59, 3], [0x3a6c49, 2], [0x5a8c69, 1.5],
        [0x2d5a1e, 0.5], [0x60946a, 0.5],
    ]);
    // Flower specks
    for (let i = 0; i < 3; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0xdddd44);
    }
    return makeTexture(c);
}

function grassSide() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    // Dirt base
    multiNoise(ctx, [
        [0x8b7355, 3], [0x7a6345, 2], [0x9b8365, 1], [0x6a5535, 0.5],
    ]);
    // Green top (5 rows with ragged edge)
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            if (y === 4 && Math.random() > 0.4) continue; // ragged
            if (y === 3 && Math.random() > 0.8) continue;
            const shade = [0x4a7c59, 0x3a6c49, 0x5a8c69, 0x2d5a1e][Math.floor(Math.random() * 4)];
            px(ctx, x, y, shade);
        }
    }
    // Roots/pebble details in dirt
    for (let i = 0; i < 4; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), 6 + Math.floor(Math.random() * 10), 0x6a5030);
    }
    return makeTexture(c);
}

function dirtTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x8b7355, 3], [0x7a6345, 2], [0x9b8365, 1.5],
        [0x6a5535, 1], [0xa09070, 0.5],
    ]);
    // Pebbles
    for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 14) + 1;
        const y = Math.floor(Math.random() * 14) + 1;
        px(ctx, x, y, 0x998870);
        px(ctx, x + 1, y, 0x887760);
    }
    // Dark patches
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 13);
        const y = Math.floor(Math.random() * 13);
        ctx.fillStyle = 'rgba(60,40,20,0.4)';
        ctx.fillRect(x, y, 3, 2);
    }
    return makeTexture(c);
}

function sandTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0xc2b280, 3], [0xb8a870, 2], [0xd4c890, 1.5],
        [0xccbc85, 1], [0xaa9a68, 0.5],
    ]);
    // Shell specks
    for (let i = 0; i < 3; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0xe8dcc0);
    }
    // Darker granules
    for (let i = 0; i < 4; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0x9a8a60);
    }
    return makeTexture(c);
}

function stoneTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x888888, 3], [0x777777, 2], [0x999999, 1.5],
        [0x6a6a6a, 1], [0xaaaaaa, 0.3],
    ]);
    // Cracks
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(3, 0, 1, 7);
    ctx.fillRect(3, 7, 5, 1);
    ctx.fillRect(7, 7, 1, 4);
    ctx.fillRect(10, 5, 1, 11);
    ctx.fillRect(10, 5, 4, 1);
    // Moss specks
    for (let i = 0; i < 3; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0x5a7a5a);
    }
    // Mineral sparkle
    for (let i = 0; i < 2; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0xbbbbbb);
    }
    return makeTexture(c);
}

function waterTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x3a6ea5, 3], [0x4a7eb5, 2], [0x2a5e95, 1],
        [0x5090c0, 0.5], [0x305a85, 0.5],
    ]);
    // Wave highlights
    for (let y = 0; y < TEX_SIZE; y++) {
        if (Math.random() > 0.7) {
            for (let x = 0; x < TEX_SIZE; x++) {
                if (Math.random() > 0.5) px(ctx, x, y, 0x6aaeee);
            }
        }
    }
    // Foam specks
    for (let i = 0; i < 3; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0x99ccee);
    }
    return makeTexture(c);
}

function woodBlockTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x8b6914, 3], [0x7b5904, 2], [0x9b7924, 1], [0x6b4f10, 0.5],
    ]);
    // Wood grain lines with variation
    for (let y = 0; y < TEX_SIZE; y++) {
        if (y % 3 === 0 || y % 5 === 0) {
            for (let x = 0; x < TEX_SIZE; x++) {
                if (Math.random() > 0.2) px(ctx, x, y, 0x6b4f10);
            }
        }
    }
    // Knot
    ctx.fillStyle = '#5a4000';
    ctx.fillRect(5, 6, 3, 3);
    px(ctx, 6, 7, 0x4a3000);
    // Border
    ctx.fillStyle = '#5a4000';
    ctx.fillRect(0, 0, TEX_SIZE, 1);
    ctx.fillRect(0, 15, TEX_SIZE, 1);
    ctx.fillRect(0, 0, 1, TEX_SIZE);
    ctx.fillRect(15, 0, 1, TEX_SIZE);
    return makeTexture(c);
}

function stoneBlockTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x666666, 3], [0x5a5a5a, 2], [0x747474, 1.5], [0x505050, 0.5],
    ]);
    // Brick mortar lines
    ctx.fillStyle = '#484848';
    ctx.fillRect(0, 0, TEX_SIZE, 1);
    ctx.fillRect(0, 7, TEX_SIZE, 1);
    ctx.fillRect(0, 15, TEX_SIZE, 1);
    ctx.fillRect(7, 0, 1, 7);
    ctx.fillRect(0, 7, 1, 8);
    ctx.fillRect(11, 8, 1, 7);
    // Surface chips
    for (let i = 0; i < 3; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0x7a7a7a);
    }
    return makeTexture(c);
}

function stoneBrickTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x777777, 3], [0x6a6a6a, 2], [0x848484, 1], [0x5e5e5e, 0.5],
    ]);
    // Clean brick pattern with mortar
    ctx.fillStyle = '#505050';
    ctx.fillRect(0, 7, TEX_SIZE, 2);
    ctx.fillRect(7, 0, 2, 7);
    ctx.fillRect(0, 9, 2, 7);
    ctx.fillRect(12, 9, 2, 7);
    // Highlight edges
    for (let i = 0; i < 4; i++) {
        px(ctx, Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 0x8e8e8e);
    }
    return makeTexture(c);
}

function coalOreTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x888888, 3], [0x777777, 2], [0x999999, 1], [0x6a6a6a, 0.5],
    ]);
    // Coal deposits — irregular dark patches
    const coalColor = 0x1a1a1a;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(2, 2, 4, 3);
    px(ctx, 2, 5, coalColor); px(ctx, 5, 1, coalColor);
    ctx.fillRect(9, 5, 5, 3);
    px(ctx, 10, 4, coalColor); px(ctx, 13, 6, coalColor);
    ctx.fillRect(4, 10, 4, 4);
    px(ctx, 3, 11, coalColor); px(ctx, 8, 12, coalColor);
    ctx.fillRect(12, 11, 3, 3);
    // Shiny coal specks
    px(ctx, 4, 3, 0x333333);
    px(ctx, 11, 6, 0x333333);
    px(ctx, 6, 12, 0x333333);
    return makeTexture(c);
}

function ironOreTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x888888, 3], [0x777777, 2], [0x999999, 1], [0x6a6a6a, 0.5],
    ]);
    // Iron ore deposits — tan/beige irregular patches
    ctx.fillStyle = '#c4a87a';
    ctx.fillRect(1, 1, 4, 3);
    px(ctx, 1, 4, 0xb49868); px(ctx, 5, 2, 0xb49868);
    ctx.fillStyle = '#d4b88a';
    ctx.fillRect(8, 4, 5, 3);
    px(ctx, 9, 3, 0xc4a87a);
    ctx.fillStyle = '#c4a87a';
    ctx.fillRect(3, 9, 4, 4);
    px(ctx, 2, 10, 0xb49868);
    ctx.fillStyle = '#d4b88a';
    ctx.fillRect(10, 10, 4, 3);
    px(ctx, 11, 9, 0xc4a87a);
    // Metallic sparkle
    px(ctx, 3, 2, 0xe0cc9a);
    px(ctx, 10, 5, 0xe0cc9a);
    px(ctx, 5, 11, 0xe0cc9a);
    return makeTexture(c);
}

function doorTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0x9b7420, 3], [0x8a6310, 2], [0xab8430, 1],
    ]);
    // Door frame
    ctx.fillStyle = '#6b4f10';
    ctx.fillRect(0, 0, 1, TEX_SIZE);
    ctx.fillRect(15, 0, 1, TEX_SIZE);
    ctx.fillRect(0, 0, TEX_SIZE, 1);
    ctx.fillRect(0, 15, TEX_SIZE, 1);
    // Panel insets
    ctx.fillStyle = '#7a5a15';
    ctx.fillRect(3, 2, 10, 5);
    ctx.fillRect(3, 9, 10, 5);
    // Panel highlight
    ctx.fillStyle = '#b09030';
    ctx.fillRect(3, 2, 10, 1);
    ctx.fillRect(3, 9, 10, 1);
    // Handle
    ctx.fillStyle = '#ddaa33';
    ctx.fillRect(12, 7, 2, 2);
    px(ctx, 12, 7, 0xeecc55);
    return makeTexture(c);
}

function fenceTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    // Transparent background
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 3; i < imgData.data.length; i += 4) imgData.data[i] = 0;
    ctx.putImageData(imgData, 0, 0);
    // Posts with wood grain
    for (let y = 0; y < TEX_SIZE; y++) {
        const shade = Math.random() > 0.3 ? '#a08040' : '#907030';
        ctx.fillStyle = shade;
        ctx.fillRect(2, y, 3, 1);
        ctx.fillRect(11, y, 3, 1);
    }
    // Rails
    for (let x = 0; x < TEX_SIZE; x++) {
        ctx.fillStyle = Math.random() > 0.3 ? '#a08040' : '#8a7035';
        ctx.fillRect(x, 4, 1, 2);
        ctx.fillRect(x, 10, 1, 2);
    }
    return makeTexture(c);
}

function torchTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    // Transparent bg
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 3; i < imgData.data.length; i += 4) imgData.data[i] = 0;
    ctx.putImageData(imgData, 0, 0);
    // Stick with grain
    for (let y = 6; y < 16; y++) {
        const shade = Math.random() > 0.4 ? 0x8b6914 : 0x7b5904;
        px(ctx, 7, y, shade);
        px(ctx, 8, y, shade);
    }
    // Flame outer
    const flame = [[6,4],[7,3],[8,3],[9,4],[5,5],[6,5],[7,4],[8,4],[9,5],[10,5],
                   [6,2],[7,2],[8,2],[9,2],[7,1],[8,1]];
    for (const [x, y] of flame) px(ctx, x, y, 0xff6600);
    // Flame inner
    const inner = [[7,3],[8,3],[7,4],[8,4],[7,2],[8,2]];
    for (const [x, y] of inner) px(ctx, x, y, 0xffcc00);
    // Core
    px(ctx, 7, 3, 0xffffaa);
    px(ctx, 8, 3, 0xffffaa);
    return makeTexture(c);
}

function ladderTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    // Transparent bg
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 3; i < imgData.data.length; i += 4) imgData.data[i] = 0;
    ctx.putImageData(imgData, 0, 0);
    // Rails with grain
    for (let y = 0; y < TEX_SIZE; y++) {
        const shade = Math.random() > 0.3 ? 0x8b6914 : 0x7b5904;
        px(ctx, 3, y, shade); px(ctx, 4, y, shade);
        px(ctx, 11, y, shade); px(ctx, 12, y, shade);
    }
    // Rungs
    for (const ry of [2, 7, 12]) {
        for (let x = 4; x <= 12; x++) {
            const shade = Math.random() > 0.3 ? 0x9b7924 : 0x7b5904;
            px(ctx, x, ry, shade);
            px(ctx, x, ry + 1, shade);
        }
    }
    return makeTexture(c);
}

function ironBlockTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    multiNoise(ctx, [
        [0xaaaaaa, 3], [0x999999, 2], [0xbbbbbb, 1.5], [0x888888, 0.5],
    ]);
    // Rivet pattern
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(12, 2, 2, 2);
    ctx.fillRect(2, 12, 2, 2);
    ctx.fillRect(12, 12, 2, 2);
    // Plate seam
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 7, TEX_SIZE, 1);
    ctx.fillRect(7, 0, 1, TEX_SIZE);
    // Shine
    px(ctx, 3, 3, 0xdddddd);
    px(ctx, 13, 3, 0xdddddd);
    return makeTexture(c);
}

// Build material cache
export function createBlockMaterials() {
    return {
        [BLOCK.GRASS]: new THREE.MeshLambertMaterial({ map: grassTop() }),
        [BLOCK.DIRT]: new THREE.MeshLambertMaterial({ map: dirtTex() }),
        [BLOCK.SAND]: new THREE.MeshLambertMaterial({ map: sandTex() }),
        [BLOCK.WATER]: new THREE.MeshLambertMaterial({ map: waterTex(), transparent: true, opacity: 0.6 }),
        [BLOCK.STONE]: new THREE.MeshLambertMaterial({ map: stoneTex() }),
        [BLOCK.WOOD_BLOCK]: new THREE.MeshLambertMaterial({ map: woodBlockTex() }),
        [BLOCK.STONE_BLOCK]: new THREE.MeshLambertMaterial({ map: stoneBlockTex() }),
        [BLOCK.WOOD_DOOR]: new THREE.MeshLambertMaterial({ map: doorTex() }),
        [BLOCK.FENCE]: new THREE.MeshLambertMaterial({ map: fenceTex() }),
        [BLOCK.TORCH]: new THREE.MeshLambertMaterial({ map: torchTex() }),
        [BLOCK.LADDER]: new THREE.MeshLambertMaterial({ map: ladderTex() }),
        [BLOCK.STONE_BRICK]: new THREE.MeshLambertMaterial({ map: stoneBrickTex() }),
        [BLOCK.COAL_ORE]: new THREE.MeshLambertMaterial({ map: coalOreTex() }),
        [BLOCK.IRON_ORE]: new THREE.MeshLambertMaterial({ map: ironOreTex() }),
        [BLOCK.IRON_BLOCK]: new THREE.MeshLambertMaterial({ map: ironBlockTex() }),
    };
}
