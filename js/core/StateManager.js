// State Manager - Central game state with pub/sub event system

import { CONFIG } from '../config.js';
import { TECH_TREE } from '../data/techTree.js';

export class StateManager {
    constructor() {
        // Event subscribers
        this.subscribers = new Map();

        // Initialize default state
        this.state = this.getDefaultState();
    }

    // Get default initial state
    getDefaultState() {
        return {
            // Meta
            version: CONFIG.VERSION,
            createdAt: Date.now(),
            lastSaveAt: null,
            totalPlayTime: 0,

            // Resources
            resources: {
                energy: CONFIG.STARTING_RESOURCES.energy,
                materials: CONFIG.STARTING_RESOURCES.materials,
                research: CONFIG.STARTING_RESOURCES.research,
            },

            // Production rates (calculated)
            production: {
                energy: CONFIG.BASE_PRODUCTION.energy,
                materials: CONFIG.BASE_PRODUCTION.materials,
                research: CONFIG.BASE_PRODUCTION.research,
            },

            // Structures - count of each type
            structures: {},

            // Construction queue
            constructionQueue: [],

            // Research
            completedResearch: ['basic_rocketry'], // Start with basic rocketry
            currentResearch: null, // Legacy - kept for compatibility
            researchProgress: 0, // Legacy - kept for compatibility
            researchQueue: [], // Array of techIds being researched
            researchProgressMap: {}, // Map of techId -> progress
            maxResearchSlots: 1, // Can be increased via upgrades
            autoResearch: false, // Auto-queue next available research

            // Progression
            currentEra: 1,
            solarCapture: 0,

            // Milestones
            claimedMilestones: [],

            // Stats
            stats: {
                totalEnergyGenerated: 0,
                totalMaterialsMined: 0,
                totalResearchCompleted: 0,
                totalStructuresBuilt: 0,
                dysonSatellites: 0,
            },

            // Settings
            settings: {
                graphicsQuality: 'medium',
                musicVolume: 50,
                sfxVolume: 70,
                showOrbits: true,
                autoSave: true,
                tutorialCompleted: false,
                tutorialStep: 0,
            },

            // UI State
            ui: {
                selectedObject: null,
                focusedPlanet: null,
                panelStates: {
                    left: true,
                    right: true,
                },
            },

            // Game flags
            flags: {
                victoryAchieved: false,
                sandboxMode: false,
            },
        };
    }

    // Subscribe to state changes
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        };
    }

    // Emit event to all subscribers
    emit(event, data) {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[StateManager] Error in ${event} callback:`, error);
                }
            }
        }

        // Also emit wildcard event
        const wildcardCallbacks = this.subscribers.get('*');
        if (wildcardCallbacks) {
            for (const callback of wildcardCallbacks) {
                try {
                    callback({ event, data });
                } catch (error) {
                    console.error('[StateManager] Error in wildcard callback:', error);
                }
            }
        }
    }

    // Get current state (read-only copy)
    getState() {
        return this.state;
    }

    // Get specific state path
    get(path) {
        const parts = path.split('.');
        let value = this.state;
        for (const part of parts) {
            if (value === undefined) return undefined;
            value = value[part];
        }
        return value;
    }

    // Set state value
    set(path, value) {
        const parts = path.split('.');
        let target = this.state;

        for (let i = 0; i < parts.length - 1; i++) {
            if (target[parts[i]] === undefined) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }

        const oldValue = target[parts[parts.length - 1]];
        target[parts[parts.length - 1]] = value;

        // Emit change event
        this.emit('state:change', { path, oldValue, newValue: value });
        this.emit(`state:${path}`, { oldValue, newValue: value });
    }

    // Update multiple values at once
    update(updates) {
        for (const [path, value] of Object.entries(updates)) {
            this.set(path, value);
        }
    }

    // Resource operations
    addResource(type, amount) {
        const current = this.state.resources[type] || 0;
        this.state.resources[type] = current + amount;
        this.emit('resource:change', { type, amount, total: this.state.resources[type] });
    }

    spendResource(type, amount) {
        const current = this.state.resources[type] || 0;
        if (current < amount) return false;
        this.state.resources[type] = current - amount;
        this.emit('resource:change', { type, amount: -amount, total: this.state.resources[type] });
        return true;
    }

    canAfford(costs) {
        for (const [type, amount] of Object.entries(costs)) {
            if ((this.state.resources[type] || 0) < amount) return false;
        }
        return true;
    }

    // Structure operations
    addStructure(structureId, count = 1) {
        const current = this.state.structures[structureId] || 0;
        this.state.structures[structureId] = current + count;
        this.state.stats.totalStructuresBuilt += count;

        // Update dyson satellite count
        if (structureId === 'dyson_satellite') {
            this.state.stats.dysonSatellites = this.state.structures[structureId];
        }

        this.emit('structure:built', { structureId, count, total: this.state.structures[structureId] });
    }

    getStructureCount(structureId) {
        return this.state.structures[structureId] || 0;
    }

    getTotalStructures() {
        return Object.values(this.state.structures).reduce((sum, count) => sum + count, 0);
    }

    // Research operations
    completeResearch(techId) {
        if (this.state.completedResearch.includes(techId)) return;

        this.state.completedResearch.push(techId);
        this.state.currentResearch = null;
        this.state.researchProgress = 0;
        this.state.stats.totalResearchCompleted++;

        this.emit('research:complete', { techId });
    }

    isResearched(techId) {
        return this.state.completedResearch.includes(techId);
    }

    canResearch(techId) {
        const tech = TECH_TREE[techId];
        if (!tech) return false;
        if (this.isResearched(techId)) return false;
        return tech.prerequisites.every(prereq => this.isResearched(prereq));
    }

    // Era operations
    setEra(era) {
        const oldEra = this.state.currentEra;
        if (era > oldEra) {
            this.state.currentEra = era;
            this.emit('era:change', { oldEra, newEra: era });
        }
    }

    // Solar capture
    setSolarCapture(percent) {
        const oldCapture = this.state.solarCapture;
        this.state.solarCapture = Math.min(1, Math.max(0, percent));
        if (this.state.solarCapture !== oldCapture) {
            this.emit('solar:capture', { percent: this.state.solarCapture });
        }
    }

    // Milestone operations
    claimMilestone(milestoneId) {
        if (this.state.claimedMilestones.includes(milestoneId)) return false;
        this.state.claimedMilestones.push(milestoneId);
        this.emit('milestone:claimed', { milestoneId });
        return true;
    }

    isMilestoneClaimed(milestoneId) {
        return this.state.claimedMilestones.includes(milestoneId);
    }

    // Construction queue
    addToQueue(item) {
        this.state.constructionQueue.push(item);
        this.emit('queue:add', { item });
    }

    removeFromQueue(index) {
        const removed = this.state.constructionQueue.splice(index, 1)[0];
        if (removed) {
            this.emit('queue:remove', { item: removed, index });
        }
        return removed;
    }

    getQueue() {
        return this.state.constructionQueue;
    }

    // Settings
    setSetting(key, value) {
        this.state.settings[key] = value;
        this.emit('setting:change', { key, value });
    }

    getSetting(key) {
        return this.state.settings[key];
    }

    // Load state from saved data
    loadState(savedState) {
        // Merge with defaults to handle missing fields from older saves
        const defaultState = this.getDefaultState();

        this.state = this.deepMerge(defaultState, savedState);

        // Ensure version is updated
        this.state.version = CONFIG.VERSION;

        this.emit('state:loaded', this.state);
    }

    // Deep merge helper
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    // Reset to default state
    reset() {
        this.state = this.getDefaultState();
        this.emit('state:reset', this.state);
    }

    // Get serializable state for saving
    getSerializableState() {
        return JSON.parse(JSON.stringify(this.state));
    }
}

// Singleton instance
let instance = null;

export function getStateManager() {
    if (!instance) {
        instance = new StateManager();
    }
    return instance;
}

export default StateManager;
