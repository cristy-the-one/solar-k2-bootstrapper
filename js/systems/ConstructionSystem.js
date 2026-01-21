// Construction System - Build queue and structure management

import { STRUCTURES, canAfford as checkCanAfford } from '../data/structures.js';
import { getStateManager } from '../core/StateManager.js';
import { getResourceSystem } from './ResourceSystem.js';

export class ConstructionSystem {
    constructor() {
        this.stateManager = getStateManager();
        this.resourceSystem = null;

        // Maximum queue size
        this.baseQueueSize = 10;

        this.autoBuildProgress = 0;
    }

    init() {
        this.resourceSystem = getResourceSystem();

        console.log('[ConstructionSystem] Initialized');
    }

    // Update called every tick
    update(deltaTime) {
        const queue = this.stateManager.getQueue();
        if (queue.length === 0) {
            this.applyAutoConstruction(deltaTime);
            return;
        }

        // Process the first item in queue
        const item = queue[0];
        const buildSpeed = this.resourceSystem.getBuildSpeed();

        // Progress construction
        item.progress += deltaTime * buildSpeed;

        // Emit progress event
        this.stateManager.emit('construction:progress', {
            item,
            progress: item.progress,
            total: item.buildTime,
            percent: item.progress / item.buildTime,
        });

        // Check if complete
        if (item.progress >= item.buildTime) {
            this.completeConstruction(item);
        }

        this.applyAutoConstruction(deltaTime);
    }

    // Start building a structure
    build(structureId, options = {}) {
        const structure = STRUCTURES[structureId];
        if (!structure) {
            console.error('[ConstructionSystem] Unknown structure:', structureId);
            return { success: false, reason: 'unknown_structure' };
        }

        // Check if tech is unlocked
        if (!this.isTechUnlocked(structure.requiresTech)) {
            return { success: false, reason: 'tech_not_unlocked' };
        }

        // Check build limit (include queued items)
        if (structure.limit !== null) {
            const currentCount = this.stateManager.getStructureCount(structureId);
            const queuedCount = this.getQueuedCount(structureId);
            if (currentCount + queuedCount >= structure.limit) {
                return { success: false, reason: 'limit_reached' };
            }
        }

        // Check if can afford
        if (!this.resourceSystem.canAfford(structure.cost)) {
            return { success: false, reason: 'cannot_afford' };
        }

        // Check queue size
        const queue = this.stateManager.getQueue();
        if (queue.length >= this.getMaxQueueSize()) {
            return { success: false, reason: 'queue_full' };
        }

        // Deduct resources
        this.resourceSystem.spend(structure.cost);

        // Add to queue
        const queueItem = {
            id: `${structureId}_${Date.now()}`,
            structureId,
            name: structure.name,
            icon: structure.icon,
            buildTime: structure.buildTime,
            progress: 0,
            placement: options.placement || structure.placement,
            position: options.position || null,
        };

        this.stateManager.addToQueue(queueItem);

        this.stateManager.emit('construction:start', { item: queueItem, structure });
        console.log('[ConstructionSystem] Started building:', structure.name);

        return { success: true, item: queueItem };
    }

    // Complete construction of an item
    completeConstruction(item) {
        // Remove from queue
        this.stateManager.removeFromQueue(0);

        // Add structure to state
        this.stateManager.addStructure(item.structureId);

        const structure = STRUCTURES[item.structureId];

        // Emit completion event
        this.stateManager.emit('construction:complete', {
            item,
            structure,
        });

        // Show notification
        this.stateManager.emit('notification', {
            type: 'success',
            title: 'Construction Complete!',
            message: `${structure.name} is now operational.`,
            icon: structure.icon,
            duration: 4000,
        });

        console.log('[ConstructionSystem] Completed:', structure.name);
    }

    // Cancel a queued item
    cancel(index) {
        const queue = this.stateManager.getQueue();
        if (index < 0 || index >= queue.length) return false;

        const item = queue[index];
        const structure = STRUCTURES[item.structureId];

        // Refund a portion of resources (50% if in progress, 100% if not started)
        let refundMultiplier = 1.0;
        if (item.progress > 0) {
            refundMultiplier = 0.5;
        }

        for (const [resource, amount] of Object.entries(structure.cost)) {
            this.resourceSystem.add(resource, Math.floor(amount * refundMultiplier));
        }

        // Remove from queue
        this.stateManager.removeFromQueue(index);

        this.stateManager.emit('construction:cancel', { item, index });
        console.log('[ConstructionSystem] Cancelled:', structure.name);

        return true;
    }

    getMaxQueueSize() {
        const launchCapacity = this.resourceSystem?.getLogistics?.().launchCapacity || 0;
        return this.baseQueueSize + Math.floor(launchCapacity);
    }

    applyAutoConstruction(deltaTime) {
        const queue = this.stateManager.getQueue();
        if (queue.length === 0) return;

        const autoConstructionRate = this.resourceSystem?.getAutoConstructionRate?.() || 0;
        if (autoConstructionRate <= 0) return;

        this.autoBuildProgress += (autoConstructionRate / 60) * deltaTime;

        while (this.autoBuildProgress >= 1 && this.stateManager.getQueue().length > 0) {
            const item = this.stateManager.getQueue()[0];
            this.completeConstruction(item);
            this.autoBuildProgress -= 1;
        }
    }

    // Check if tech is unlocked
    isTechUnlocked(techId) {
        return this.stateManager.isResearched(techId);
    }

    // Get available structures (tech unlocked)
    getAvailableStructures() {
        const completedResearch = this.stateManager.getState().completedResearch;

        return Object.values(STRUCTURES).filter(structure =>
            completedResearch.includes(structure.requiresTech)
        );
    }

    // Get structure build status
    getStructureStatus(structureId) {
        const structure = STRUCTURES[structureId];
        if (!structure) return null;

        const state = this.stateManager.getState();
        const currentCount = state.structures[structureId] || 0;
        const queuedCount = this.getQueuedCount(structureId);
        const totalPlanned = currentCount + queuedCount;
        const techUnlocked = state.completedResearch.includes(structure.requiresTech);
        const affordable = this.resourceSystem.canAfford(structure.cost);

        return {
            structure,
            currentCount,
            queuedCount,
            totalPlanned,
            techUnlocked,
            affordable,
            atLimit: structure.limit !== null && totalPlanned >= structure.limit,
            canBuild: techUnlocked && affordable && (structure.limit === null || totalPlanned < structure.limit),
        };
    }

    // Get current construction progress
    getCurrentConstruction() {
        const queue = this.stateManager.getQueue();
        if (queue.length === 0) return null;

        const item = queue[0];
        return {
            item,
            percent: item.progress / item.buildTime,
            remaining: item.buildTime - item.progress,
        };
    }

    // Get queue
    getQueue() {
        return this.stateManager.getQueue();
    }

    // Check if queue is empty
    isQueueEmpty() {
        return this.stateManager.getQueue().length === 0;
    }

    // Get count of a structure type
    getCount(structureId) {
        return this.stateManager.getStructureCount(structureId);
    }

    // Get total structures built
    getTotalStructures() {
        return this.stateManager.getTotalStructures();
    }

    getQueuedCount(structureId) {
        return this.stateManager
            .getQueue()
            .filter(item => item.structureId === structureId)
            .length;
    }

    // Bulk build multiple structures
    bulkBuild(structureId, count) {
        const results = [];

        for (let i = 0; i < count; i++) {
            const result = this.build(structureId);
            results.push(result);

            if (!result.success) {
                break; // Stop on first failure
            }
        }

        return results;
    }
}

// Singleton instance
let instance = null;

export function getConstructionSystem() {
    if (!instance) {
        instance = new ConstructionSystem();
    }
    return instance;
}

export default ConstructionSystem;
