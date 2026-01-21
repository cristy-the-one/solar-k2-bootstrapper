// Resource System - Manages energy, materials, and research production

import { CONFIG } from '../config.js';
import { STRUCTURES } from '../data/structures.js';
import { TECH_TREE } from '../data/techTree.js';
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

        this.logistics = {
            launchCapacity: 0,
            cargoCapacity: 0,
            population: 0,
            autoConstruction: 0,
            energyEfficiency: 0,
            dysonBonus: 1,
            exoticMaterials: 0,
            antimatter: 0,
            energyStorage: 0,
            solarMatter: 0,
            computation: 0,
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
        let energyFromDyson = 0;

        let launchCapacity = 0;
        let cargoCapacity = 0;
        let population = 0;
        let autoConstruction = 0;
        let energyEfficiency = 0;
        let dysonBonusMultiplier = 1;
        let exoticMaterials = 0;
        let antimatter = 0;
        let energyStorage = 0;
        let solarMatter = 0;
        let computation = 0;

        // Add production from each structure type
        for (const [structureId, count] of Object.entries(structures)) {
            if (count <= 0) continue;

            const structureDef = STRUCTURES[structureId];
            if (!structureDef || !structureDef.production) continue;

            const prod = structureDef.production;

            // Add energy production
            if (prod.energy) {
                if (prod.solarCapture) {
                    energyFromDyson += prod.energy * count;
                } else {
                    energy += prod.energy * count;
                }
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

            // Logistics/auxiliary production
            if (prod.launchCapacity) {
                launchCapacity += prod.launchCapacity * count;
            }

            if (prod.cargoCapacity) {
                cargoCapacity += prod.cargoCapacity * count;
            }

            if (prod.population) {
                population += prod.population * count;
            }

            if (prod.autoConstruction) {
                autoConstruction += prod.autoConstruction * count;
            }

            if (prod.energyEfficiency) {
                energyEfficiency += prod.energyEfficiency * count;
            }

            if (prod.dysonBonus) {
                dysonBonusMultiplier += (prod.dysonBonus - 1) * count;
            }

            if (prod.exoticMaterials) {
                exoticMaterials += prod.exoticMaterials * count;
            }

            if (prod.antimatter) {
                antimatter += prod.antimatter * count;
            }

            if (prod.energyStorage) {
                energyStorage += prod.energyStorage * count;
            }

            if (prod.solarMatter) {
                solarMatter += prod.solarMatter * count;
            }

            if (prod.computation) {
                computation += prod.computation * count;
            }
        }

        const techModifiers = this.getTechModifiers(state.completedResearch || []);
        const cargoMultiplier = 1 + cargoCapacity / 1000;
        const populationMultiplier = 1 + population / 10000;
        const energyEfficiencyMultiplier = 1 + energyEfficiency;
        const exoticMaterialMultiplier = 1 + exoticMaterials * 0.02;
        const antimatterMultiplier = 1 + antimatter * 0.1;
        const storageMultiplier = 1 + energyStorage / 100000;
        const solarMatterMultiplier = 1 + solarMatter * 0.005;
        const computationMultiplier = 1 + computation / 1000000 * 0.25;

        // Apply modifiers
        const energyModifier = this.modifiers.energy * techModifiers.energy * energyEfficiencyMultiplier * antimatterMultiplier * storageMultiplier;
        const materialsModifier = this.modifiers.materials * techModifiers.materials * cargoMultiplier * exoticMaterialMultiplier * solarMatterMultiplier;
        const researchModifier = this.modifiers.research * techModifiers.research * populationMultiplier * computationMultiplier;

        energy *= energyModifier;
        materials *= materialsModifier;
        research *= researchModifier;

        energyFromDyson *= energyModifier * dysonBonusMultiplier * techModifiers.dysonEfficiency;
        solarCapture *= dysonBonusMultiplier * techModifiers.dysonEfficiency;

        energy += energyFromDyson;

        this.modifiers.buildSpeed = (1 + buildSpeedBonus + launchCapacity * 0.02) * techModifiers.buildSpeed;

        // Update state
        this.stateManager.state.production = {
            energy,
            materials,
            research,
        };

        // Update solar capture
        this.stateManager.setSolarCapture(solarCapture);

        this.logistics = {
            launchCapacity,
            cargoCapacity,
            population,
            autoConstruction,
            energyEfficiency,
            dysonBonus: dysonBonusMultiplier,
            exoticMaterials,
            antimatter,
            energyStorage,
            solarMatter,
            computation,
        };

        // Emit production update event
        this.stateManager.emit('production:update', {
            energy,
            materials,
            research,
            solarCapture,
            logistics: this.logistics,
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

    getAutoConstructionRate() {
        return this.logistics.autoConstruction;
    }

    getLogistics() {
        return this.logistics;
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

    getTechModifiers(completedResearch) {
        const modifiers = {
            energy: 1,
            materials: 1,
            research: 1,
            buildSpeed: 1,
            dysonEfficiency: 1,
        };

        for (const techId of completedResearch) {
            const effects = TECH_TREE[techId]?.effects;
            if (!effects) continue;

            if (effects.energyGeneration) {
                modifiers.energy *= effects.energyGeneration;
            }

            if (effects.energyProduction) {
                modifiers.energy *= effects.energyProduction;
            }

            if (effects.solarEfficiency) {
                modifiers.energy *= effects.solarEfficiency;
            }

            if (effects.materialProduction) {
                modifiers.materials *= effects.materialProduction;
            }

            if (effects.researchEfficiency) {
                modifiers.research *= effects.researchEfficiency;
            }

            if (effects.productionMultiplier) {
                modifiers.energy *= effects.productionMultiplier;
                modifiers.materials *= effects.productionMultiplier;
                modifiers.research *= effects.productionMultiplier;
            }

            if (effects.buildSpeed) {
                modifiers.buildSpeed *= effects.buildSpeed;
            }

            if (effects.constructionEfficiency) {
                modifiers.buildSpeed *= effects.constructionEfficiency;
            }

            if (effects.dysonEfficiency) {
                modifiers.dysonEfficiency *= effects.dysonEfficiency;
            }
        }

        return modifiers;
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
