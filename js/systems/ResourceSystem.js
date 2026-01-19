// Resource System - Manages energy, materials, and research production

import { CONFIG } from '../config.js';
import { STRUCTURES } from '../data/structures.js';
import { getStateManager } from '../core/StateManager.js';

export class ResourceSystem {
    constructor() {
        this.stateManager = getStateManager();

        // Production modifiers
        this.modifiers = {
            energy: 1.0,
            materials: 1.0,
            research: 1.0,
            buildSpeed: 1.0,
        };
    }

    init() {
        // Calculate initial production rates
        this.recalculateProduction();

        // Listen for structure changes
        this.stateManager.subscribe('structure:built', () => {
            this.recalculateProduction();
        });

        // Listen for research completion
        this.stateManager.subscribe('research:complete', () => {
            this.recalculateProduction();
        });

        console.log('[ResourceSystem] Initialized');
    }

    // Update called every tick
    update(deltaTime) {
        const state = this.stateManager.getState();
        const production = state.production;

        // Generate resources
        if (production.energy > 0) {
            this.stateManager.addResource('energy', production.energy * deltaTime);
            this.stateManager.state.stats.totalEnergyGenerated += production.energy * deltaTime;
        }

        if (production.materials > 0) {
            this.stateManager.addResource('materials', production.materials * deltaTime);
            this.stateManager.state.stats.totalMaterialsMined += production.materials * deltaTime;
        }

        if (production.research > 0) {
            this.stateManager.addResource('research', production.research * deltaTime);
        }
    }

    // Recalculate all production rates based on structures
    recalculateProduction() {
        const state = this.stateManager.getState();
        const structures = state.structures;

        // Start with base production
        let energy = CONFIG.BASE_PRODUCTION.energy;
        let materials = CONFIG.BASE_PRODUCTION.materials;
        let research = CONFIG.BASE_PRODUCTION.research;
        let buildSpeedBonus = 0;
        let solarCapture = 0;

        // Add production from each structure type
        for (const [structureId, count] of Object.entries(structures)) {
            if (count <= 0) continue;

            const structureDef = STRUCTURES[structureId];
            if (!structureDef || !structureDef.production) continue;

            const prod = structureDef.production;

            // Add energy production
            if (prod.energy) {
                energy += prod.energy * count;
            }

            // Add materials production
            if (prod.materials) {
                materials += prod.materials * count;
            }

            // Add research production
            if (prod.research) {
                research += prod.research * count;
            }

            // Add build speed bonus
            if (prod.buildSpeedBonus) {
                buildSpeedBonus += prod.buildSpeedBonus * count;
            }

            // Add solar capture
            if (prod.solarCapture) {
                solarCapture += prod.solarCapture * count;
            }
        }

        // Apply modifiers
        energy *= this.modifiers.energy;
        materials *= this.modifiers.materials;
        research *= this.modifiers.research;
        this.modifiers.buildSpeed = 1 + buildSpeedBonus;

        // Update state
        this.stateManager.state.production = {
            energy,
            materials,
            research,
        };

        // Update solar capture
        this.stateManager.setSolarCapture(solarCapture);

        // Emit production update event
        this.stateManager.emit('production:update', {
            energy,
            materials,
            research,
            solarCapture,
        });
    }

    // Set a production modifier
    setModifier(type, value) {
        this.modifiers[type] = value;
        this.recalculateProduction();
    }

    // Get current production rates
    getProduction() {
        return this.stateManager.getState().production;
    }

    // Get resource amounts
    getResources() {
        return this.stateManager.getState().resources;
    }

    // Check if can afford a cost
    canAfford(costs) {
        return this.stateManager.canAfford(costs);
    }

    // Spend resources
    spend(costs) {
        for (const [type, amount] of Object.entries(costs)) {
            if (!this.stateManager.spendResource(type, amount)) {
                return false;
            }
        }
        return true;
    }

    // Add resources
    add(type, amount) {
        this.stateManager.addResource(type, amount);
    }

    // Get build speed multiplier
    getBuildSpeed() {
        return this.modifiers.buildSpeed;
    }

    // Calculate how long until can afford something
    getTimeToAfford(costs) {
        const resources = this.getResources();
        const production = this.getProduction();
        let maxTime = 0;

        for (const [type, amount] of Object.entries(costs)) {
            const current = resources[type] || 0;
            const rate = production[type] || 0;

            if (current >= amount) continue;

            if (rate <= 0) return Infinity;

            const needed = amount - current;
            const time = needed / rate;
            maxTime = Math.max(maxTime, time);
        }

        return maxTime;
    }
}

// Singleton instance
let instance = null;

export function getResourceSystem() {
    if (!instance) {
        instance = new ResourceSystem();
    }
    return instance;
}

export default ResourceSystem;
