// BlockTextures.js — Generates procedural pixel-art textures for blocks
import * as THREE from 'three';
import { BLOCK } from './WorldData.js';

const TEX_SIZE = 16; // 16x16 pixel textures like Minecraft

function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    return canvas;
}

function noise(ctx, baseColor, noiseColor, density = 0.3) {
    const [br, bg, bb] = hexToRGB(baseColor);
    const [nr, ng, nb] = hexToRGB(noiseColor);
    const imgData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
        if (Math.random() < density) {
            imgData.data[i] = nr;
            imgData.data[i + 1] = ng;
            imgData.data[i + 2] = nb;
        } else {
            imgData.data[i] = br;
            imgData.data[i + 1] = bg;
            imgData.data[i + 2] = bb;
        }
        imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}

function hexToRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
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
    noise(ctx, 0x4a7c59, 0x3a6c49, 0.4);
    // Random darker blades
    for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * TEX_SIZE);
        const y = Math.floor(Math.random() * TEX_SIZE);
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(x, y, 1, 1);
    }
    return makeTexture(c);
}

function grassSide() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    // Top 4 rows green, rest dirt
    noise(ctx, 0x8b7355, 0x7a6345, 0.3);
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const green = Math.random() < 0.6 ? 0x4a7c59 : 0x3a6c49;
            const [r, g, b] = hexToRGB(green);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    // Ragged edge
    for (let x = 0; x < TEX_SIZE; x++) {
        if (Math.random() > 0.5) {
            const [r, g, b] = hexToRGB(0x4a7c59);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, 4, 1, 1);
        }
    }
    return makeTexture(c);
}

function dirtTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x8b7355, 0x7a6345, 0.35);
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#6a5535';
        ctx.fillRect(Math.floor(Math.random() * 14), Math.floor(Math.random() * 14), 2, 2);
    }
    return makeTexture(c);
}

function sandTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0xc2b280, 0xb8a870, 0.3);
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#d4c890';
        ctx.fillRect(Math.floor(Math.random() * TEX_SIZE), Math.floor(Math.random() * TEX_SIZE), 1, 1);
    }
    return makeTexture(c);
}

function stoneTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x888888, 0x777777, 0.4);
    // Cracks
    ctx.fillStyle = '#666';
    ctx.fillRect(3, 0, 1, 8);
    ctx.fillRect(10, 6, 1, 10);
    ctx.fillRect(3, 8, 7, 1);
    return makeTexture(c);
}

function waterTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x3a6ea5, 0x4a7eb5, 0.3);
    // Wave highlights
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(100,180,255,0.5)';
        const y = Math.floor(Math.random() * TEX_SIZE);
        ctx.fillRect(0, y, TEX_SIZE, 1);
    }
    return makeTexture(c);
}

function woodBlockTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x8b6914, 0x7b5904, 0.25);
    // Wood grain lines
    ctx.fillStyle = '#6b4f10';
    for (let y = 0; y < TEX_SIZE; y += 4) {
        ctx.fillRect(0, y, TEX_SIZE, 1);
    }
    // Border
    ctx.strokeStyle = '#5a4000';
    ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
    return makeTexture(c);
}

function stoneBlockTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x666666, 0x5a5a5a, 0.3);
    // Brick pattern
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, TEX_SIZE, 1);
    ctx.fillRect(0, 8, TEX_SIZE, 1);
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(0, 8, 1, 8);
    return makeTexture(c);
}

function stoneBrickTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x777777, 0x6a6a6a, 0.25);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 7, TEX_SIZE, 2);
    ctx.fillRect(7, 0, 2, 7);
    ctx.fillRect(0, 7, 2, 9);
    return makeTexture(c);
}

function coalOreTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x888888, 0x777777, 0.4);
    // Coal spots
    ctx.fillStyle = '#222';
    ctx.fillRect(3, 3, 3, 3);
    ctx.fillRect(10, 5, 4, 3);
    ctx.fillRect(5, 10, 3, 4);
    ctx.fillRect(12, 12, 2, 2);
    return makeTexture(c);
}

function ironOreTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x888888, 0x777777, 0.4);
    // Iron spots (tan/beige)
    ctx.fillStyle = '#c4a87a';
    ctx.fillRect(2, 2, 3, 3);
    ctx.fillRect(9, 4, 4, 3);
    ctx.fillRect(4, 10, 3, 3);
    ctx.fillRect(11, 11, 3, 2);
    return makeTexture(c);
}

function doorTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    noise(ctx, 0x9b7420, 0x8a6310, 0.2);
    // Door panel lines
    ctx.fillStyle = '#6b4f10';
    ctx.fillRect(0, 0, 1, TEX_SIZE);
    ctx.fillRect(TEX_SIZE - 1, 0, 1, TEX_SIZE);
    ctx.fillRect(0, 0, TEX_SIZE, 1);
    ctx.fillRect(0, TEX_SIZE - 1, TEX_SIZE, 1);
    // Handle
    ctx.fillStyle = '#ddaa33';
    ctx.fillRect(TEX_SIZE - 4, 7, 2, 2);
    return makeTexture(c);
}

function fenceTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Posts and rails
    ctx.fillStyle = '#a08040';
    ctx.fillRect(2, 0, 2, TEX_SIZE);
    ctx.fillRect(12, 0, 2, TEX_SIZE);
    ctx.fillRect(0, 4, TEX_SIZE, 2);
    ctx.fillRect(0, 10, TEX_SIZE, 2);
    return makeTexture(c);
}

function torchTex() {
    const c = createCanvas();
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Stick
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(7, 6, 2, 10);
    // Flame
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(5, 2, 6, 5);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(6, 3, 4, 3);
    return makeTexture(c);
}

// Build material cache
export function createBlockMaterials() {
    const grass_top = grassTop();
    const grass_side = grassSide();
    const dirt = dirtTex();
    const sand = sandTex();
    const stone = stoneTex();
    const water = waterTex();

    return {
        [BLOCK.GRASS]: new THREE.MeshLambertMaterial({ map: grass_top }),
        [`${BLOCK.GRASS}_side`]: grass_side, // for future multi-face support
        [BLOCK.DIRT]: new THREE.MeshLambertMaterial({ map: dirt }),
        [BLOCK.SAND]: new THREE.MeshLambertMaterial({ map: sand }),
        [BLOCK.WATER]: (() => {
            const m = new THREE.MeshLambertMaterial({ map: water, transparent: true, opacity: 0.6 });
            return m;
        })(),
        [BLOCK.STONE]: new THREE.MeshLambertMaterial({ map: stone }),
        [BLOCK.WOOD_BLOCK]: new THREE.MeshLambertMaterial({ map: woodBlockTex() }),
        [BLOCK.STONE_BLOCK]: new THREE.MeshLambertMaterial({ map: stoneBlockTex() }),
        [BLOCK.WOOD_DOOR]: new THREE.MeshLambertMaterial({ map: doorTex() }),
        [BLOCK.FENCE]: new THREE.MeshLambertMaterial({ map: fenceTex() }),
        [BLOCK.TORCH]: new THREE.MeshLambertMaterial({ map: torchTex() }),
        [BLOCK.LADDER]: new THREE.MeshLambertMaterial({ map: woodBlockTex() }), // reuse wood
        [BLOCK.STONE_BRICK]: new THREE.MeshLambertMaterial({ map: stoneBrickTex() }),
        // Ores
        13: new THREE.MeshLambertMaterial({ map: coalOreTex() }),  // COAL_ORE
        14: new THREE.MeshLambertMaterial({ map: ironOreTex() }),  // IRON_ORE
    };
}
