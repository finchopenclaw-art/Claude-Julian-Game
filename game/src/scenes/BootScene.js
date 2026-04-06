export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() {
        console.log('[BootScene] ready');
        this.scene.start('World');
    }
}
