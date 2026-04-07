// DayNightCycle.js — Animates sun, sky color, and ambient light
import * as THREE from 'three';

export class DayNightCycle {
    constructor(scene, sunLight, ambientLight) {
        this.scene = scene;
        this.sunLight = sunLight;
        this.ambientLight = ambientLight;

        // Full day cycle duration in seconds (4 minutes)
        this.cycleDuration = 240;
        this.timeOfDay = 0.25; // Start at sunrise (0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset)

        // Sky colors at key times
        this.skyColors = {
            midnight: new THREE.Color(0x0a0a2e),
            sunrise:  new THREE.Color(0xff7744),
            morning:  new THREE.Color(0x87ceeb),
            noon:     new THREE.Color(0x87ceeb),
            sunset:   new THREE.Color(0xff6633),
            evening:  new THREE.Color(0x1a1a4e),
        };

        // HUD element for time display
        this._createTimeDisplay();
    }

    _createTimeDisplay() {
        const el = document.createElement('div');
        el.id = 'time-display';
        el.style.cssText = 'position:absolute;top:12px;left:180px;color:#fff;font-size:12px;font-family:Arial;text-shadow:1px 1px #000;pointer-events:none;';
        document.getElementById('hud').appendChild(el);
        this.timeEl = el;
    }

    update(dt) {
        // Advance time
        this.timeOfDay += dt / this.cycleDuration;
        if (this.timeOfDay >= 1) this.timeOfDay -= 1;

        const t = this.timeOfDay;

        // Sun angle — orbits in a circle
        const sunAngle = t * Math.PI * 2 - Math.PI / 2; // starts at horizon at t=0
        const sunHeight = Math.sin(sunAngle);
        const sunHoriz = Math.cos(sunAngle);

        this.sunLight.position.set(sunHoriz * 30, Math.max(sunHeight * 30, -5), 20);

        // Sun intensity — bright during day, off at night
        const dayFactor = Math.max(0, sunHeight);
        this.sunLight.intensity = dayFactor * 0.9;

        // Ambient light — never fully dark (moonlight)
        this.ambientLight.intensity = 0.15 + dayFactor * 0.5;

        // Sky color
        const skyColor = this._getSkyColor(t);
        this.scene.background.copy(skyColor);
        this.scene.fog.color.copy(skyColor);

        // Shadow on/off
        this.sunLight.castShadow = sunHeight > 0;

        // Time display
        this._updateTimeDisplay(t);
    }

    _getSkyColor(t) {
        const c = this.skyColors;
        // Key time points
        if (t < 0.2) return this._lerpColor(c.midnight, c.sunrise, t / 0.2);
        if (t < 0.3) return this._lerpColor(c.sunrise, c.morning, (t - 0.2) / 0.1);
        if (t < 0.5) return this._lerpColor(c.morning, c.noon, (t - 0.3) / 0.2);
        if (t < 0.7) return this._lerpColor(c.noon, c.sunset, (t - 0.5) / 0.2);
        if (t < 0.8) return this._lerpColor(c.sunset, c.evening, (t - 0.7) / 0.1);
        return this._lerpColor(c.evening, c.midnight, (t - 0.8) / 0.2);
    }

    _lerpColor(a, b, f) {
        const result = new THREE.Color();
        result.r = a.r + (b.r - a.r) * f;
        result.g = a.g + (b.g - a.g) * f;
        result.b = a.b + (b.b - a.b) * f;
        return result;
    }

    _updateTimeDisplay(t) {
        // Convert to 24-hour clock
        const hours = Math.floor(t * 24);
        const minutes = Math.floor((t * 24 - hours) * 60);
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');

        let period = '';
        if (t < 0.25) period = '🌙';
        else if (t < 0.35) period = '🌅';
        else if (t < 0.7) period = '☀️';
        else if (t < 0.8) period = '🌅';
        else period = '🌙';

        this.timeEl.textContent = `${period} ${h}:${m}`;
    }
}
