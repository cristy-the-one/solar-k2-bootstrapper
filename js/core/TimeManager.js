// Time Manager - Delta time, game time, and offline progress calculation

import { CONFIG } from '../config.js';
import { getStateManager } from './StateManager.js';

export class TimeManager {
    constructor() {
        this.stateManager = getStateManager();

        // Time tracking
        this.gameTime = 0; // Total seconds of game time
        this.sessionStartTime = Date.now();
        this.lastUpdateTime = Date.now();

        // Time scale for debugging/sandbox
        this.timeScale = 1.0;

        // Pause state
        this.isPaused = false;
    }

    // Initialize and calculate offline progress
    init() {
        const state = this.stateManager.getState();

        // Restore total play time
        this.gameTime = state.totalPlayTime || 0;

        // Calculate offline progress if there was a previous session
        if (state.lastSaveAt) {
            this.calculateOfflineProgress();
        }

        console.log('[TimeManager] Initialized');
    }

    // Calculate resources gained while offline
    calculateOfflineProgress() {
        const state = this.stateManager.getState();
        const now = Date.now();

        if (!state.lastSaveAt) return null;

        // Calculate offline duration in seconds
        let offlineSeconds = (now - state.lastSaveAt) / 1000;

        // Cap at maximum offline time
        const maxOfflineSeconds = CONFIG.MAX_OFFLINE_HOURS * 60 * 60;
        offlineSeconds = Math.min(offlineSeconds, maxOfflineSeconds);

        // No significant offline time
        if (offlineSeconds < 60) return null;

        // Apply offline efficiency
        const effectiveSeconds = offlineSeconds * CONFIG.OFFLINE_EFFICIENCY;

        // Calculate resources gained
        const production = state.production;
        const gains = {
            energy: production.energy * effectiveSeconds,
            materials: production.materials * effectiveSeconds,
            research: production.research * effectiveSeconds,
        };

        // Apply gains
        for (const [resource, amount] of Object.entries(gains)) {
            if (amount > 0) {
                this.stateManager.addResource(resource, amount);
            }
        }

        // Emit offline progress event for UI notification
        const result = {
            offlineSeconds,
            effectiveSeconds,
            gains,
        };

        this.stateManager.emit('offline:progress', result);
        console.log('[TimeManager] Offline progress calculated:', result);

        return result;
    }

    // Update called every frame
    update(deltaTime) {
        if (this.isPaused) return 0;

        // Apply time scale
        const scaledDelta = deltaTime * this.timeScale;

        // Update game time
        this.gameTime += scaledDelta;

        // Update total play time in state periodically
        this.stateManager.state.totalPlayTime = this.gameTime;

        return scaledDelta;
    }

    // Get current game time in seconds
    getGameTime() {
        return this.gameTime;
    }

    // Get session duration in seconds
    getSessionDuration() {
        return (Date.now() - this.sessionStartTime) / 1000;
    }

    // Set time scale (for sandbox/debug mode)
    setTimeScale(scale) {
        this.timeScale = Math.max(0, Math.min(10, scale)); // Clamp 0-10x
        this.stateManager.emit('time:scale', { scale: this.timeScale });
    }

    // Get current time scale
    getTimeScale() {
        return this.timeScale;
    }

    // Pause game time
    pause() {
        this.isPaused = true;
        this.stateManager.emit('time:pause', {});
    }

    // Resume game time
    resume() {
        this.isPaused = false;
        this.stateManager.emit('time:resume', {});
    }

    // Toggle pause
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.isPaused;
    }

    // Check if paused
    getIsPaused() {
        return this.isPaused;
    }

    // Format time as human readable
    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}m ${secs}s`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days}d ${hours}h`;
        }
    }

    // Get formatted play time
    getFormattedPlayTime() {
        return this.formatTime(this.gameTime);
    }

    // Get formatted session time
    getFormattedSessionTime() {
        return this.formatTime(this.getSessionDuration());
    }
}

// Singleton instance
let instance = null;

export function getTimeManager() {
    if (!instance) {
        instance = new TimeManager();
    }
    return instance;
}

export default TimeManager;
