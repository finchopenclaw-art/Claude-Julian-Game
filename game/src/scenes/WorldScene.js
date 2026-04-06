export class WorldScene extends Phaser.Scene {
    constructor() { super('World'); }
    create() {
        console.log('[WorldScene] ready');
        this.scene.launch('UI');
    }
}
