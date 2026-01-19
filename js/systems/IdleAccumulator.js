// Idle Accumulator - Background resource generation and offline progress

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getTimeManager } from '../core/TimeManager.js';

export class IdleAccumulator {
    constructor() {
        this.stateManager = getStateManager();
        this.timeManager = null;

        // Offline progress result (if any)
        this.offlineProgress = null;
    }

    init() {
        this.timeManager = getTimeManager();

        // Calculate offline progress on init
        this.calculateOfflineProgress();

        console.log('[IdleAccumulator] Initialized');
    }

    // Calculate and apply offline progress
    calculateOfflineProgress() {
        const state = this.stateManager.getState();

        // Check if there's a previous session
        if (!state.lastSaveAt) {
            this.offlineProgress = null;
            return null;
        }

        const now = Date.now();
        let offlineMs = now - state.lastSaveAt;

        // No significant offline time (less than 1 minute)
        if (offlineMs < 60000) {
            this.offlineProgress = null;
            return null;
        }

        // Cap at maximum offline time
        const maxOfflineMs = CONFIG.MAX_OFFLINE_HOURS * 60 * 60 * 1000;
        offlineMs = Math.min(offlineMs, maxOfflineMs);

        const offlineSeconds = offlineMs / 1000;

        // Apply offline efficiency
        const effectiveSeconds = offlineSeconds * CONFIG.OFFLINE_EFFICIENCY;

        // Calculate resource gains
        const production = state.production;
        const gains = {
            energy: Math.floor(production.energy * effectiveSeconds),
            materials: Math.floor(production.materials * effectiveSeconds),
            research: Math.floor(production.research * effectiveSeconds),
        };

        // Apply gains
        for (const [resource, amount] of Object.entries(gains)) {
            if (amount > 0) {
                this.stateManager.addResource(resource, amount);
            }
        }

        // Store result for UI display
        this.offlineProgress = {
            offlineSeconds,
            effectiveSeconds,
            gains,
            wasMaxed: offlineMs >= maxOfflineMs,
        };

        // Emit event for UI
        this.stateManager.emit('offline:progress', this.offlineProgress);

        console.log('[IdleAccumulator] Offline progress calculated:', this.offlineProgress);

        return this.offlineProgress;
    }

    // Get offline progress result
    getOfflineProgress() {
        return this.offlineProgress;
    }

    // Clear offline progress (after displaying to user)
    clearOfflineProgress() {
        this.offlineProgress = null;
    }

    // Calculate projected gains for a given duration
    projectGains(seconds, efficiencyMultiplier = 1.0) {
        const production = this.stateManager.getState().production;

        return {
            energy: production.energy * seconds * efficiencyMultiplier,
            materials: production.materials * seconds * efficiencyMultiplier,
            research: production.research * seconds * efficiencyMultiplier,
        };
    }

    // Get formatted offline progress summary
    getOfflineProgressSummary() {
        if (!this.offlineProgress) return null;

        const { offlineSeconds, gains, wasMaxed } = this.offlineProgress;
        const timeStr = this.timeManager.formatTime(offlineSeconds);

        let summary = `While you were away for ${timeStr}`;
        if (wasMaxed) {
            summary += ` (capped at ${CONFIG.MAX_OFFLINE_HOURS} hours)`;
        }
        summary += ':';

        const gainsList = [];
        if (gains.energy > 0) {
            gainsList.push(`+${this.formatNumber(gains.energy)} Energy`);
        }
        if (gains.materials > 0) {
            gainsList.push(`+${this.formatNumber(gains.materials)} Materials`);
        }
        if (gains.research > 0) {
            gainsList.push(`+${this.formatNumber(gains.research)} Research`);
        }

        return {
            title: 'Welcome Back!',
            summary,
            gains: gainsList,
        };
    }

    // Format number for display
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
}

// Singleton instance
let instance = null;

export function getIdleAccumulator() {
    if (!instance) {
        instance = new IdleAccumulator();
    }
    return instance;
}

export default IdleAccumulator;
