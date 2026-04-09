// TouchControls.js — Virtual D-pad, camera drag, and action buttons for mobile
// Only initializes on touch devices

export class TouchControls {
    constructor() {
        this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        this.moveDir = { x: 0, z: 0 }; // -1 to 1 for D-pad
        this.lookDelta = { x: 0, y: 0 }; // accumulated camera rotation delta
        this.active = false;

        // Callbacks — set by main.js
        this.onInteract = null; // E button
        this.onPlace = null;    // Build button
        this.onRemove = null;   // Break button

        if (this.isTouch) {
            this._build();
            this.active = true;
        }
    }

    _build() {
        // Hide click-to-play (pointer lock doesn't work on iOS)
        const ctp = document.getElementById('click-to-play');
        if (ctp) ctp.style.display = 'none';

        // Container for touch controls
        const container = document.createElement('div');
        container.id = 'touch-controls';
        container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:30;';
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .touch-btn {
                pointer-events:auto; position:absolute; display:flex;
                align-items:center; justify-content:center;
                background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.3);
                border-radius:12px; color:#fff; font-size:16px; font-weight:bold;
                font-family:Arial; text-shadow:1px 1px 2px rgba(0,0,0,0.5);
                user-select:none; -webkit-user-select:none; touch-action:none;
            }
            .touch-btn:active { background:rgba(255,255,255,0.3); }
            .dpad-btn { width:60px; height:60px; border-radius:10px; font-size:22px; }
            .action-btn { width:64px; height:64px; border-radius:50%; }
            .small-btn { width:50px; height:36px; border-radius:8px; font-size:12px; }
            #touch-look-area {
                pointer-events:auto; position:absolute;
                top:0; left:120px; right:120px; bottom:200px;
                touch-action:none;
            }
        `;
        document.head.appendChild(style);

        // ===== CAMERA LOOK AREA (center of screen) =====
        const lookArea = document.createElement('div');
        lookArea.id = 'touch-look-area';
        container.appendChild(lookArea);

        let lookTouchId = null;
        let lastLookX = 0, lastLookY = 0;

        lookArea.addEventListener('touchstart', (e) => {
            if (lookTouchId !== null) return;
            const t = e.changedTouches[0];
            lookTouchId = t.identifier;
            lastLookX = t.clientX;
            lastLookY = t.clientY;
            e.preventDefault();
        }, { passive: false });

        lookArea.addEventListener('touchmove', (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === lookTouchId) {
                    this.lookDelta.x += (t.clientX - lastLookX) * 0.004;
                    this.lookDelta.y += (t.clientY - lastLookY) * 0.004;
                    lastLookX = t.clientX;
                    lastLookY = t.clientY;
                }
            }
            e.preventDefault();
        }, { passive: false });

        lookArea.addEventListener('touchend', (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === lookTouchId) lookTouchId = null;
            }
        });

        // ===== D-PAD (bottom-left) =====
        const padCX = 75;
        const padCY = window.innerHeight - 150;
        const B = 60;
        const G = 6;

        const makeDpad = (label, x, y, dx, dz) => {
            const btn = document.createElement('div');
            btn.className = 'touch-btn dpad-btn';
            btn.style.left = x + 'px';
            btn.style.bottom = (window.innerHeight - y - B) + 'px';
            btn.textContent = label;
            container.appendChild(btn);

            btn.addEventListener('touchstart', (e) => {
                this.moveDir.x += dx;
                this.moveDir.z += dz;
                e.preventDefault();
            }, { passive: false });
            btn.addEventListener('touchend', (e) => {
                this.moveDir.x -= dx;
                this.moveDir.z -= dz;
                // Clamp to prevent drift
                this.moveDir.x = Math.round(this.moveDir.x);
                this.moveDir.z = Math.round(this.moveDir.z);
                e.preventDefault();
            }, { passive: false });
            return btn;
        };

        makeDpad('\u25B2', padCX - B/2, padCY - B - G, 0, -1);     // Forward
        makeDpad('\u25BC', padCX - B/2, padCY + G, 0, 1);           // Back
        makeDpad('\u25C0', padCX - B - G, padCY - B/2 + G/2, -1, 0); // Left
        makeDpad('\u25B6', padCX + G, padCY - B/2 + G/2, 1, 0);     // Right

        // ===== ACTION BUTTONS (bottom-right) =====
        const rightX = window.innerWidth - 90;
        const rightY = window.innerHeight - 140;

        const makeAction = (label, x, y, color, callback) => {
            const btn = document.createElement('div');
            btn.className = 'touch-btn action-btn';
            btn.style.right = (window.innerWidth - x - 64) + 'px';
            btn.style.bottom = (window.innerHeight - y - 64) + 'px';
            btn.style.background = color;
            btn.textContent = label;
            container.appendChild(btn);
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (callback) callback();
            }, { passive: false });
            return btn;
        };

        // E button — interact (gather/eat/door)
        makeAction('E', rightX - 32, rightY - 32, 'rgba(40,120,40,0.4)', () => {
            if (this.onInteract) this.onInteract();
        });

        // Build button
        makeAction('Build', rightX - 100, rightY - 32, 'rgba(40,70,120,0.4)', () => {
            if (this.onPlace) this.onPlace();
        });

        // Break button
        makeAction('Break', rightX - 32, rightY - 100, 'rgba(120,40,40,0.4)', () => {
            if (this.onRemove) this.onRemove();
        });

        // ===== TOP MENU BUTTONS =====
        const makeSmall = (label, right, top, callback) => {
            const btn = document.createElement('div');
            btn.className = 'touch-btn small-btn';
            btn.style.right = right + 'px';
            btn.style.top = top + 'px';
            btn.textContent = label;
            container.appendChild(btn);
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (callback) callback();
            }, { passive: false });
            return btn;
        };

        this.onCraft = null;
        this.onInventory = null;
        this.onMenu = null;

        makeSmall('C', 12, 12, () => { if (this.onCraft) this.onCraft(); });
        makeSmall('Inv', 68, 12, () => { if (this.onInventory) this.onInventory(); });
        makeSmall('\u2630', 124, 12, () => { if (this.onMenu) this.onMenu(); });

        // Handle resize
        window.addEventListener('resize', () => {
            // D-pad and action buttons use fixed positions, which is fine for now
        });
    }

    consumeLookDelta() {
        const dx = this.lookDelta.x;
        const dy = this.lookDelta.y;
        this.lookDelta.x = 0;
        this.lookDelta.y = 0;
        return { x: dx, y: dy };
    }
}
