// HUD.js — HTML overlay UI for the 3D game
import { ItemDefs } from '../data/ItemDefs.js';
import { RecipeDefs } from '../data/RecipeDefs.js';

const ITEM_COLORS = {
    Wood: '#8b6914', Stone: '#888', WoodPlank: '#c4a35a', Stick: '#b89050',
    StoneTool: '#aaa', WoodBlock: '#8b6914', StoneBlock: '#666',
    WoodDoor: '#9b7420', Fence: '#a08040', Torch: '#ff8800',
    Ladder: '#8b6914', StoneBrick: '#777',
    CookedMeat: '#cc6633', Berry: '#cc2244', BerryPie: '#dd6688',
    RawMeat: '#aa4444', Leather: '#8b6040',
};

export class HUD {
    constructor(inventory, craftSystem, survivalSystem) {
        this.inventory = inventory;
        this.craftSystem = craftSystem;
        this.survivalSystem = survivalSystem;
        this.hud = document.getElementById('hud');
        this.inventoryOpen = false;
        this.craftingOpen = false;
        this._swapFrom = -1;
        this._craftPage = 0;

        // Action callbacks (set by main.js)
        this.onGather = null;
        this.onPlace = null;
        this.onRemove = null;
        this.onToggleDoor = null;
        this.onSave = null;
        this.onLoad = null;

        this._build();
        this.inventory.onChange(() => this.refresh());
    }

    _build() {
        this.hud.innerHTML = `
            <div id="bars" style="position:absolute;top:12px;left:12px;">
                <div style="background:#333;width:154px;height:18px;border-radius:3px;margin-bottom:4px;">
                    <div id="hp-bar" style="background:#c33;width:150px;height:16px;margin:1px;border-radius:2px;"></div>
                    <span style="position:relative;top:-16px;left:6px;color:#fff;font-size:11px;text-shadow:1px 1px #000;">HP</span>
                </div>
                <div style="background:#333;width:154px;height:18px;border-radius:3px;">
                    <div id="hunger-bar" style="background:#ca3;width:150px;height:16px;margin:1px;border-radius:2px;"></div>
                    <span style="position:relative;top:-16px;left:6px;color:#fff;font-size:11px;text-shadow:1px 1px #000;">Hunger</span>
                </div>
            </div>
            <div id="hotbar" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:3px;"></div>
            <div id="gather-info" style="position:absolute;bottom:90px;left:50%;transform:translateX(-50%);color:#ff8;font-size:14px;text-shadow:1px 1px #000;display:none;"></div>
            <div id="panel-overlay" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,0.6);z-index:50;"></div>
            <div id="panel" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;border:2px solid #555;border-radius:8px;padding:16px;z-index:51;max-height:80vh;overflow-y:auto;min-width:300px;"></div>
            <div id="btn-row" style="position:absolute;top:12px;right:12px;display:flex;gap:6px;"></div>
            <div id="float-text" style="position:absolute;top:40%;left:50%;transform:translateX(-50%);color:#ff8;font-size:18px;text-shadow:2px 2px #000;display:none;pointer-events:none;"></div>
        `;

        // Hotbar
        this._buildHotbar();

        // Top buttons
        const btnRow = document.getElementById('btn-row');
        btnRow.innerHTML = `
            <button class="hud-btn" id="btn-craft">C</button>
            <button class="hud-btn" id="btn-inv">Inv</button>
            <button class="hud-btn" id="btn-menu">☰</button>
        `;

        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            .hud-btn { background:rgba(50,50,50,0.8); color:#fff; border:1px solid #666; border-radius:4px; padding:6px 12px; font-size:13px; cursor:pointer; font-family:Arial; }
            .hud-btn:active { background:rgba(80,80,80,0.9); }
            .slot { width:48px; height:48px; background:rgba(30,30,30,0.8); border:2px solid #555; border-radius:4px; display:flex; align-items:center; justify-content:center; position:relative; cursor:pointer; }
            .slot.selected { border-color:#fc0; box-shadow:0 0 6px rgba(255,204,0,0.4); }
            .slot-icon { width:36px; height:36px; border-radius:2px; }
            .slot-qty { position:absolute; bottom:2px; right:4px; color:#fff; font-size:11px; text-shadow:1px 1px #000; }
            .slot-num { position:absolute; top:1px; left:3px; color:#888; font-size:9px; }
            #panel::-webkit-scrollbar { width:6px; }
            #panel::-webkit-scrollbar-thumb { background:#555; border-radius:3px; }
            .menu-item { background:rgba(50,50,50,0.9); border:1px solid #666; border-radius:4px; padding:8px 16px; color:#fff; cursor:pointer; font-size:13px; margin-bottom:4px; text-align:center; }
            .menu-item:active { background:rgba(80,80,80,0.9); }
        `;
        document.head.appendChild(style);

        // Event listeners
        document.getElementById('btn-craft').addEventListener('click', () => this.toggleCrafting());
        document.getElementById('btn-inv').addEventListener('click', () => this.toggleInventory());
        document.getElementById('btn-menu').addEventListener('click', () => this._showMenu());

        document.getElementById('panel-overlay').addEventListener('click', () => this._closePanel());
    }

    _buildHotbar() {
        const hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot' + (i === this.inventory.selectedSlot ? ' selected' : '');
            slot.innerHTML = `<span class="slot-num">${i + 1}</span>`;

            const data = this.inventory.getSlot(i);
            if (data) {
                const color = ITEM_COLORS[data.itemId] || '#fff';
                slot.innerHTML += `<div class="slot-icon" style="background:${color}"></div>`;
                if (data.quantity > 1) slot.innerHTML += `<span class="slot-qty">${data.quantity}</span>`;
            }

            slot.addEventListener('click', () => {
                this.inventory.selectSlot(i);
            });
            hotbar.appendChild(slot);
        }
    }

    refresh() {
        this._buildHotbar();
        if (this.inventoryOpen) this._renderInventory();
        if (this.craftingOpen) this._renderCrafting();
    }

    updateBars() {
        const hp = document.getElementById('hp-bar');
        const hunger = document.getElementById('hunger-bar');
        if (hp) hp.style.width = (this.survivalSystem.health / this.survivalSystem.maxHealth * 150) + 'px';
        if (hunger) hunger.style.width = (this.survivalSystem.hunger / this.survivalSystem.maxHunger * 150) + 'px';
    }

    showGatherInfo(text) {
        const el = document.getElementById('gather-info');
        el.textContent = text;
        el.style.display = 'block';
    }

    hideGatherInfo() {
        document.getElementById('gather-info').style.display = 'none';
    }

    showFloatText(text) {
        const el = document.getElementById('float-text');
        el.textContent = text;
        el.style.display = 'block';
        el.style.opacity = '1';
        el.style.transition = 'none';
        setTimeout(() => {
            el.style.transition = 'opacity 0.8s';
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 800);
        }, 50);
    }

    // --- Panels ---

    _closePanel() {
        this.inventoryOpen = false;
        this.craftingOpen = false;
        this._swapFrom = -1;
        document.getElementById('panel').style.display = 'none';
        document.getElementById('panel-overlay').style.display = 'none';
    }

    toggleInventory() {
        if (this.craftingOpen) this._closePanel();
        this.inventoryOpen = !this.inventoryOpen;
        if (this.inventoryOpen) {
            document.getElementById('panel-overlay').style.display = 'block';
            this._renderInventory();
        } else {
            this._closePanel();
        }
    }

    toggleCrafting() {
        if (this.inventoryOpen) this._closePanel();
        this.craftingOpen = !this.craftingOpen;
        if (this.craftingOpen) {
            document.getElementById('panel-overlay').style.display = 'block';
            this._renderCrafting();
        } else {
            this._closePanel();
        }
    }

    _renderInventory() {
        const panel = document.getElementById('panel');
        const swapHint = this._swapFrom >= 0 ? ' — Tap slot to swap' : ' — Tap to move items';
        let html = `<h3 style="color:#fff;margin:0 0 10px;font-size:15px;">Inventory${swapHint}</h3>`;
        html += '<div style="display:grid;grid-template-columns:repeat(5,52px);gap:4px;">';

        for (let i = 0; i < 20; i++) {
            const data = this.inventory.getSlot(i);
            const isSelected = i === this._swapFrom;
            const border = isSelected ? '2px solid #fc0' : '1px solid #444';
            const bg = isSelected ? '#444400' : '#222';

            html += `<div class="inv-slot" data-idx="${i}" style="width:50px;height:50px;background:${bg};border:${border};border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;">`;
            if (data) {
                const color = ITEM_COLORS[data.itemId] || '#fff';
                const name = ItemDefs[data.itemId]?.displayName || data.itemId;
                html += `<div style="width:36px;height:36px;background:${color};border-radius:2px;" title="${name}"></div>`;
                if (data.quantity > 1) html += `<span style="position:absolute;bottom:1px;right:3px;color:#fff;font-size:10px;text-shadow:1px 1px #000;">${data.quantity}</span>`;
                html += `<span style="position:absolute;top:1px;left:3px;color:#aaa;font-size:8px;">${name}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';

        panel.innerHTML = html;
        panel.style.display = 'block';

        // Attach click handlers
        panel.querySelectorAll('.inv-slot').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.idx);
                if (this._swapFrom < 0) {
                    this._swapFrom = idx;
                } else if (this._swapFrom === idx) {
                    this._swapFrom = -1;
                } else {
                    this.inventory.swapSlots(this._swapFrom, idx);
                    this._swapFrom = -1;
                }
                this._renderInventory();
            });
        });
    }

    _renderCrafting() {
        const panel = document.getElementById('panel');
        const recipes = this.craftSystem.getRecipes();
        const perPage = 6;
        const totalPages = Math.ceil(recipes.length / perPage);
        this._craftPage = Math.min(this._craftPage, totalPages - 1);
        const pageRecipes = recipes.slice(this._craftPage * perPage, (this._craftPage + 1) * perPage);

        let html = `<h3 style="color:#fff;margin:0 0 10px;font-size:15px;">Crafting (${this._craftPage + 1}/${totalPages})</h3>`;

        for (const recipe of pageRecipes) {
            const inputStr = Object.entries(recipe.inputs).map(([id, qty]) => `${qty} ${id}`).join(', ');
            const border = recipe.craftable ? '1px solid #4ade80' : '1px solid #444';
            const bg = recipe.craftable ? '#2a3a2a' : '#2a2a2a';
            const nameColor = recipe.craftable ? '#fff' : '#666';
            const descColor = recipe.craftable ? '#aaa' : '#555';
            const outColor = recipe.craftable ? '#4ade80' : '#555';

            html += `<div class="recipe-row" data-id="${recipe.id}" style="background:${bg};border:${border};border-radius:4px;padding:8px 12px;margin-bottom:6px;cursor:${recipe.craftable ? 'pointer' : 'default'};">`;
            html += `<div style="color:${nameColor};font-weight:bold;font-size:13px;">${recipe.displayName}</div>`;
            html += `<div style="display:flex;justify-content:space-between;font-size:11px;">`;
            html += `<span style="color:${descColor};">Needs: ${inputStr}</span>`;
            html += `<span style="color:${outColor};">→ ${recipe.outputQty} ${recipe.output}</span>`;
            html += `</div></div>`;
        }

        // Pagination
        html += '<div style="display:flex;justify-content:center;gap:10px;margin-top:8px;">';
        if (this._craftPage > 0) html += `<button class="hud-btn" id="craft-prev">◀ Prev</button>`;
        if (this._craftPage < totalPages - 1) html += `<button class="hud-btn" id="craft-next">Next ▶</button>`;
        html += '</div>';

        panel.innerHTML = html;
        panel.style.display = 'block';

        // Click handlers
        panel.querySelectorAll('.recipe-row').forEach(el => {
            const id = el.dataset.id;
            const recipe = recipes.find(r => r.id === id);
            if (recipe && recipe.craftable) {
                el.addEventListener('click', () => {
                    this.craftSystem.craft(id);
                    this._renderCrafting();
                });
            }
        });

        document.getElementById('craft-prev')?.addEventListener('click', () => {
            this._craftPage--;
            this._renderCrafting();
        });
        document.getElementById('craft-next')?.addEventListener('click', () => {
            this._craftPage++;
            this._renderCrafting();
        });
    }

    _showMenu() {
        const panel = document.getElementById('panel');
        document.getElementById('panel-overlay').style.display = 'block';
        panel.innerHTML = `
            <h3 style="color:#fff;margin:0 0 10px;font-size:15px;">Menu</h3>
            <div class="menu-item" id="menu-save">💾 Save Game</div>
            <div class="menu-item" id="menu-load">📂 Load Game</div>
            <div class="menu-item" id="menu-help">❓ Help</div>
            <div class="menu-item" id="menu-close">✕ Close</div>
        `;
        panel.style.display = 'block';

        document.getElementById('menu-save').addEventListener('click', () => {
            if (this.onSave) this.onSave();
            this._closePanel();
        });
        document.getElementById('menu-load').addEventListener('click', () => {
            if (this.onLoad) this.onLoad();
            this._closePanel();
        });
        document.getElementById('menu-help').addEventListener('click', () => {
            this._showHelp();
        });
        document.getElementById('menu-close').addEventListener('click', () => {
            this._closePanel();
        });
    }

    _showHelp() {
        const panel = document.getElementById('panel');
        panel.innerHTML = `
            <h3 style="color:#4ade80;margin:0 0 6px;font-size:18px;">Survival Crafting 3D</h3>
            <p style="color:#ccc;font-style:italic;font-size:12px;margin-bottom:12px;">Gather resources. Craft tools. Build shelter. Survive.</p>
            <div style="color:#fff;font-size:12px;line-height:1.8;">
                <b style="color:#4ade80;">1. GATHER</b> — Walk near trees/rocks, press <b>E</b> to collect<br>
                <b style="color:#4ade80;">2. CRAFT</b> — Press <b>C</b> to open crafting, click recipes<br>
                <b style="color:#4ade80;">3. BUILD</b> — Select a block, press <b>Q</b> to place where you look<br>
                <b style="color:#4ade80;">4. SURVIVE</b> — Select food, press <b>E</b> to eat. Don't starve!
            </div>
            <hr style="border-color:#333;margin:10px 0;">
            <div style="color:#aaa;font-size:11px;line-height:2;">
                <b>WASD</b> Move &nbsp; <b>Mouse</b> Look &nbsp; <b>E</b> Gather/Eat/Door<br>
                <b>Q</b> Place block &nbsp; <b>X</b> Remove block<br>
                <b>C</b> Crafting &nbsp; <b>I/Tab</b> Inventory &nbsp; <b>1-8</b> Hotbar<br>
                <b>P</b> Save &nbsp; <b>L</b> Load &nbsp; <b>Esc</b> Release mouse
            </div>
            <div class="menu-item" style="margin-top:12px;" id="help-close">Close</div>
        `;
        document.getElementById('help-close').addEventListener('click', () => this._closePanel());
    }

    isAnyPanelOpen() {
        return this.inventoryOpen || this.craftingOpen ||
            document.getElementById('panel').style.display === 'block';
    }
}
