// Game Loop Manager - Handles requestAnimationFrame and fixed timestep updates

import { CONFIG } from '../config.js';

export class GameLoop {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1000 / CONFIG.TICK_RATE;

        // Callbacks
        this.updateCallbacks = [];
        this.renderCallbacks = [];

        // Performance tracking
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Bind the loop function
        this.loop = this.loop.bind(this);
    }

    // Add update callback (called at fixed timestep)
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
        return () => {
            const index = this.updateCallbacks.indexOf(callback);
            if (index > -1) this.updateCallbacks.splice(index, 1);
        };
    }

    // Add render callback (called every frame)
    onRender(callback) {
        this.renderCallbacks.push(callback);
        return () => {
            const index = this.renderCallbacks.indexOf(callback);
            if (index > -1) this.renderCallbacks.splice(index, 1);
        };
    }

    // Start the game loop
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fpsUpdateTime = this.lastTime;
        this.frameCount = 0;

        requestAnimationFrame(this.loop);
        console.log('[GameLoop] Started');
    }

    // Stop the game loop
    stop() {
        this.isRunning = false;
        console.log('[GameLoop] Stopped');
    }

    // Main loop function
    loop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Prevent spiral of death - cap delta time
        const cappedDelta = Math.min(deltaTime, 250);
        this.accumulator += cappedDelta;

        // Fixed timestep updates
        while (this.accumulator >= this.fixedDeltaTime) {
            const dt = this.fixedDeltaTime / 1000; // Convert to seconds

            for (const callback of this.updateCallbacks) {
                try {
                    callback(dt);
                } catch (error) {
                    console.error('[GameLoop] Update error:', error);
                }
            }

            this.accumulator -= this.fixedDeltaTime;
        }

        // Render (every frame)
        const alpha = this.accumulator / this.fixedDeltaTime;

        for (const callback of this.renderCallbacks) {
            try {
                callback(deltaTime / 1000, alpha);
            } catch (error) {
                console.error('[GameLoop] Render error:', error);
            }
        }

        // FPS calculation
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        // Continue loop
        requestAnimationFrame(this.loop);
    }

    // Get current FPS
    getFPS() {
        return this.fps;
    }

    // Check if loop is running
    getIsRunning() {
        return this.isRunning;
    }
}

// Singleton instance
let instance = null;

export function getGameLoop() {
    if (!instance) {
        instance = new GameLoop();
    }
    return instance;
}

export default GameLoop;
