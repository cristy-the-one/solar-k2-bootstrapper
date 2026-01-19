// Save System - LocalStorage persistence with auto-save and migration

import { CONFIG } from '../config.js';
import { getStateManager } from './StateManager.js';

const SAVE_KEY = 'solarK2Bootstrapper_save';
const BACKUP_KEY = 'solarK2Bootstrapper_backup';

export class SaveSystem {
    constructor() {
        this.stateManager = getStateManager();
        this.autoSaveInterval = null;
        this.lastSaveTime = 0;
        this.saveDebounceTimer = null;
    }

    // Initialize save system
    init() {
        // Try to load existing save
        const loaded = this.load();

        // Start auto-save if enabled
        if (this.stateManager.getSetting('autoSave')) {
            this.startAutoSave();
        }

        // Listen for setting changes
        this.stateManager.subscribe('setting:change', ({ key, value }) => {
            if (key === 'autoSave') {
                if (value) {
                    this.startAutoSave();
                } else {
                    this.stopAutoSave();
                }
            }
        });

        // Save on important events (debounced)
        this.stateManager.subscribe('structure:built', () => this.debouncedSave());
        this.stateManager.subscribe('research:complete', () => this.debouncedSave());
        this.stateManager.subscribe('milestone:claimed', () => this.debouncedSave());

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.save();
        });

        // Handle visibility change (save when tab becomes hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.save();
            }
        });

        return loaded;
    }

    // Save current state to LocalStorage
    save() {
        try {
            const state = this.stateManager.getSerializableState();
            state.lastSaveAt = Date.now();

            // Create backup of previous save first
            const previousSave = localStorage.getItem(SAVE_KEY);
            if (previousSave) {
                localStorage.setItem(BACKUP_KEY, previousSave);
            }

            // Save new state
            const saveData = JSON.stringify(state);
            localStorage.setItem(SAVE_KEY, saveData);

            this.lastSaveTime = Date.now();
            this.stateManager.emit('save:complete', { timestamp: this.lastSaveTime });

            console.log('[SaveSystem] Game saved');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Save failed:', error);
            this.stateManager.emit('save:error', { error });
            return false;
        }
    }

    // Debounced save (prevents too frequent saves)
    debouncedSave() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        this.saveDebounceTimer = setTimeout(() => {
            this.save();
            this.saveDebounceTimer = null;
        }, 1000); // 1 second debounce
    }

    // Load state from LocalStorage
    load() {
        try {
            const saveData = localStorage.getItem(SAVE_KEY);

            if (!saveData) {
                console.log('[SaveSystem] No save found, starting fresh');
                return false;
            }

            const state = JSON.parse(saveData);

            // Check version and migrate if needed
            const migratedState = this.migrate(state);

            // Load into state manager
            this.stateManager.loadState(migratedState);

            console.log('[SaveSystem] Game loaded');
            this.stateManager.emit('save:loaded', { state: migratedState });

            return true;
        } catch (error) {
            console.error('[SaveSystem] Load failed:', error);

            // Try backup
            return this.loadBackup();
        }
    }

    // Load from backup
    loadBackup() {
        try {
            const backupData = localStorage.getItem(BACKUP_KEY);

            if (!backupData) {
                console.log('[SaveSystem] No backup found');
                return false;
            }

            const state = JSON.parse(backupData);
            const migratedState = this.migrate(state);
            this.stateManager.loadState(migratedState);

            console.log('[SaveSystem] Loaded from backup');
            this.stateManager.emit('save:loaded', { state: migratedState, fromBackup: true });

            return true;
        } catch (error) {
            console.error('[SaveSystem] Backup load failed:', error);
            return false;
        }
    }

    // Migrate save data from older versions
    migrate(state) {
        const currentVersion = CONFIG.VERSION;
        const saveVersion = state.version || '0.0.0';

        if (saveVersion === currentVersion) {
            return state;
        }

        console.log(`[SaveSystem] Migrating save from ${saveVersion} to ${currentVersion}`);

        // Version-specific migrations would go here
        // Example:
        // if (this.compareVersions(saveVersion, '1.1.0') < 0) {
        //     state = this.migrateTo1_1_0(state);
        // }

        // Update version
        state.version = currentVersion;

        return state;
    }

    // Compare version strings
    compareVersions(a, b) {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (partsA[i] > partsB[i]) return 1;
            if (partsA[i] < partsB[i]) return -1;
        }

        return 0;
    }

    // Start auto-save interval
    startAutoSave() {
        if (this.autoSaveInterval) return;

        this.autoSaveInterval = setInterval(() => {
            this.save();
        }, CONFIG.AUTO_SAVE_INTERVAL);

        console.log('[SaveSystem] Auto-save started');
    }

    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('[SaveSystem] Auto-save stopped');
        }
    }

    // Delete save data
    deleteSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
            localStorage.removeItem(BACKUP_KEY);
            console.log('[SaveSystem] Save deleted');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Delete failed:', error);
            return false;
        }
    }

    // Reset game (delete save and reset state)
    resetGame() {
        this.deleteSave();
        this.stateManager.reset();
        this.stateManager.emit('game:reset', {});
    }

    // Export save as JSON string (for manual backup)
    exportSave() {
        const state = this.stateManager.getSerializableState();
        return JSON.stringify(state, null, 2);
    }

    // Import save from JSON string
    importSave(jsonString) {
        try {
            const state = JSON.parse(jsonString);

            // Basic validation
            if (!state.version || !state.resources) {
                throw new Error('Invalid save format');
            }

            const migratedState = this.migrate(state);
            this.stateManager.loadState(migratedState);
            this.save();

            console.log('[SaveSystem] Save imported');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Import failed:', error);
            return false;
        }
    }

    // Check if save exists
    hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    // Get last save time
    getLastSaveTime() {
        return this.lastSaveTime;
    }

    // Calculate offline time since last save
    getOfflineTime() {
        const state = this.stateManager.getState();
        if (!state.lastSaveAt) return 0;

        const now = Date.now();
        const offlineMs = now - state.lastSaveAt;

        // Cap at max offline hours
        const maxOfflineMs = CONFIG.MAX_OFFLINE_HOURS * 60 * 60 * 1000;

        return Math.min(offlineMs, maxOfflineMs);
    }
}

// Singleton instance
let instance = null;

export function getSaveSystem() {
    if (!instance) {
        instance = new SaveSystem();
    }
    return instance;
}

export default SaveSystem;
