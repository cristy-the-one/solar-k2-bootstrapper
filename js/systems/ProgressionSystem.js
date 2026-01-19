// Progression System - Tech tree, eras, and milestones

import { CONFIG } from '../config.js';
import { TECH_TREE, getAvailableTechs } from '../data/techTree.js';
import { MILESTONES, checkMilestoneCondition, getNewlyAchievedMilestones } from '../data/milestones.js';
import { getStateManager } from '../core/StateManager.js';

export class ProgressionSystem {
    constructor() {
        this.stateManager = getStateManager();

        // Research queue support
        this.researchQueue = []; // Array of techIds being researched
        this.researchProgressMap = {}; // techId -> progress
    }

    init() {
        const state = this.stateManager.getState();

        // Restore research state (support both legacy and new format)
        if (state.researchQueue && state.researchQueue.length > 0) {
            this.researchQueue = [...state.researchQueue];
            this.researchProgressMap = { ...state.researchProgressMap };
        } else if (state.currentResearch) {
            // Migrate legacy single research to queue
            this.researchQueue = [state.currentResearch];
            this.researchProgressMap = { [state.currentResearch]: state.researchProgress || 0 };
        }

        // Listen for state changes to check milestones
        this.stateManager.subscribe('structure:built', () => this.checkMilestones());
        this.stateManager.subscribe('research:complete', () => {
            this.checkMilestones();
            this.tryAutoResearch();
        });
        this.stateManager.subscribe('solar:capture', () => this.checkMilestones());

        // Initial milestone check
        this.checkMilestones();

        console.log('[ProgressionSystem] Initialized');
    }

    // Update called every tick
    update(deltaTime) {
        // Progress all researching items
        if (this.researchQueue.length > 0) {
            this.progressAllResearch(deltaTime);
        }

        // Check for era progression based on solar capture
        this.checkEraProgression();

        // Try auto-research if enabled
        this.tryAutoResearch();
    }

    // Start researching a technology
    startResearch(techId) {
        const tech = TECH_TREE[techId];
        if (!tech) {
            console.error('[ProgressionSystem] Unknown tech:', techId);
            return false;
        }

        // Check if already researched
        if (this.stateManager.isResearched(techId)) {
            console.warn('[ProgressionSystem] Tech already researched:', techId);
            return false;
        }

        // Check if already in queue
        if (this.researchQueue.includes(techId)) {
            console.warn('[ProgressionSystem] Tech already in research queue:', techId);
            return false;
        }

        // Check prerequisites
        if (!this.stateManager.canResearch(techId)) {
            console.warn('[ProgressionSystem] Prerequisites not met for:', techId);
            return false;
        }

        // Check if we have available research slots
        const state = this.stateManager.getState();
        const maxSlots = state.maxResearchSlots || 1;
        if (this.researchQueue.length >= maxSlots) {
            this.stateManager.emit('notification', {
                type: 'warning',
                title: 'Research Queue Full',
                message: `Maximum ${maxSlots} concurrent research${maxSlots > 1 ? 'es' : ''}. Complete or cancel one first.`,
                duration: 3000,
            });
            return false;
        }

        // Start research
        this.researchQueue.push(techId);
        this.researchProgressMap[techId] = 0;

        // Sync with state
        this.syncStateWithQueue();

        this.stateManager.emit('research:start', { techId, tech });
        console.log('[ProgressionSystem] Started researching:', tech.name);

        return true;
    }

    // Progress all researching items
    progressAllResearch(deltaTime) {
        if (this.researchQueue.length === 0) return;

        const state = this.stateManager.getState();
        const totalResearchRate = state.production.research;

        if (totalResearchRate <= 0) return;

        // Divide research rate among all active researches
        const perItemRate = totalResearchRate / this.researchQueue.length;

        // Process research queue (iterate backwards for safe removal)
        const completed = [];
        for (const techId of this.researchQueue) {
            const tech = TECH_TREE[techId];
            if (!tech) continue;

            // Add research progress
            this.researchProgressMap[techId] = (this.researchProgressMap[techId] || 0) + perItemRate * deltaTime;

            // Check if complete
            const cost = tech.cost.research;
            if (this.researchProgressMap[techId] >= cost) {
                completed.push(techId);
            } else {
                // Emit progress event
                this.stateManager.emit('research:progress', {
                    techId,
                    progress: this.researchProgressMap[techId],
                    total: cost,
                    percent: this.researchProgressMap[techId] / cost,
                });
            }
        }

        // Complete finished research
        for (const techId of completed) {
            this.completeResearch(techId);
        }

        // Sync with state
        this.syncStateWithQueue();
    }

    // Complete research
    completeResearch(techId) {
        const tech = TECH_TREE[techId];
        if (!tech) return;

        // Remove from queue
        const index = this.researchQueue.indexOf(techId);
        if (index > -1) {
            this.researchQueue.splice(index, 1);
        }
        delete this.researchProgressMap[techId];

        // Mark as completed in state
        this.stateManager.completeResearch(techId);

        // Sync with state
        this.syncStateWithQueue();

        console.log('[ProgressionSystem] Completed research:', tech.name);

        // Apply special effects
        if (tech.effects) {
            // Grant additional research slots
            if (tech.effects.researchSlots) {
                for (let i = 0; i < tech.effects.researchSlots; i++) {
                    this.addResearchSlot();
                }
            }
        }

        // Show notification for unlocks
        if (tech.unlocks && tech.unlocks.length > 0) {
            // Filter out internal unlocks like 'research_slot' for cleaner display
            const displayUnlocks = tech.unlocks.filter(u => !u.startsWith('research_'));
            if (displayUnlocks.length > 0) {
                this.stateManager.emit('notification', {
                    type: 'success',
                    title: `${tech.name} Complete!`,
                    message: `Unlocked: ${displayUnlocks.join(', ')}`,
                    duration: 5000,
                });
            } else {
                this.stateManager.emit('notification', {
                    type: 'success',
                    title: `${tech.name} Complete!`,
                    message: tech.description,
                    duration: 5000,
                });
            }
        }
    }

    // Cancel a specific research
    cancelResearch(techId) {
        const index = this.researchQueue.indexOf(techId);
        if (index === -1) return false;

        this.researchQueue.splice(index, 1);
        delete this.researchProgressMap[techId];

        // Sync with state
        this.syncStateWithQueue();

        this.stateManager.emit('research:cancel', { techId });
        return true;
    }

    // Sync local state with StateManager
    syncStateWithQueue() {
        const state = this.stateManager.state;
        state.researchQueue = [...this.researchQueue];
        state.researchProgressMap = { ...this.researchProgressMap };

        // Legacy compatibility
        state.currentResearch = this.researchQueue[0] || null;
        state.researchProgress = this.researchProgressMap[this.researchQueue[0]] || 0;
    }

    // Try to auto-queue next available research
    tryAutoResearch() {
        const state = this.stateManager.getState();
        if (!state.autoResearch) return;

        const maxSlots = state.maxResearchSlots || 1;
        if (this.researchQueue.length >= maxSlots) return;

        // Get available techs not already in queue
        const availableTechs = this.getAvailableTechs().filter(
            tech => !this.researchQueue.includes(tech.id)
        );

        if (availableTechs.length === 0) return;

        // Pick the first available (lowest era, prerequisites met)
        const nextTech = availableTechs[0];
        this.startResearch(nextTech.id);
    }

    // Toggle auto-research
    setAutoResearch(enabled) {
        this.stateManager.state.autoResearch = enabled;
        this.stateManager.emit('setting:change', { key: 'autoResearch', value: enabled });
        if (enabled) {
            this.tryAutoResearch();
        }
    }

    // Increase research slots (called when certain techs are completed)
    addResearchSlot() {
        this.stateManager.state.maxResearchSlots = (this.stateManager.state.maxResearchSlots || 1) + 1;
        this.stateManager.emit('notification', {
            type: 'success',
            title: 'Research Capacity Increased!',
            message: `You can now research ${this.stateManager.state.maxResearchSlots} technologies simultaneously.`,
            duration: 5000,
        });
    }

    // Get available technologies
    getAvailableTechs() {
        const completedResearch = this.stateManager.getState().completedResearch;
        return getAvailableTechs(completedResearch);
    }

    // Check if a tech is being researched
    isResearching(techId) {
        return this.researchQueue.includes(techId);
    }

    // Get research progress for a specific tech
    getResearchProgressFor(techId) {
        if (!this.researchQueue.includes(techId)) return null;

        const tech = TECH_TREE[techId];
        if (!tech) return null;

        return {
            techId,
            tech,
            progress: this.researchProgressMap[techId] || 0,
            total: tech.cost.research,
            percent: (this.researchProgressMap[techId] || 0) / tech.cost.research,
        };
    }

    // Get all research progress (legacy compatibility + new)
    getResearchProgress() {
        if (this.researchQueue.length === 0) return null;

        // Return first item for legacy compatibility
        return this.getResearchProgressFor(this.researchQueue[0]);
    }

    // Get all active research
    getAllResearchProgress() {
        return this.researchQueue.map(techId => this.getResearchProgressFor(techId)).filter(Boolean);
    }

    // Check and claim milestones
    checkMilestones() {
        const state = this.stateManager.getState();

        // Build game state object for milestone checking
        const gameState = {
            structures: state.structures,
            solarCapture: state.solarCapture,
            completedResearch: state.completedResearch,
            totalTechCount: Object.keys(TECH_TREE).length,
            currentEra: state.currentEra,
        };

        // Get newly achieved milestones
        const newMilestones = getNewlyAchievedMilestones(gameState, state.claimedMilestones);

        // Process each new milestone
        for (const milestone of newMilestones) {
            this.claimMilestone(milestone);
        }
    }

    // Claim a milestone
    claimMilestone(milestone) {
        if (!this.stateManager.claimMilestone(milestone.id)) return;

        // Grant rewards
        if (milestone.reward) {
            for (const [resource, amount] of Object.entries(milestone.reward)) {
                if (resource === 'sandbox_mode') {
                    this.stateManager.set('flags.sandboxMode', true);
                } else {
                    this.stateManager.addResource(resource, amount);
                }
            }
        }

        // Emit notification
        this.stateManager.emit('notification', {
            type: 'achievement',
            title: milestone.name,
            message: milestone.notification || milestone.description,
            icon: milestone.icon,
            duration: 8000,
        });

        console.log('[ProgressionSystem] Milestone achieved:', milestone.name);

        // Check for victory
        if (milestone.isVictory) {
            this.triggerVictory();
        }
    }

    // Check if era should advance
    checkEraProgression() {
        const state = this.stateManager.getState();
        const currentEra = state.currentEra;
        const solarCapture = state.solarCapture;

        // Check each era threshold
        for (const [era, eraData] of Object.entries(CONFIG.ERAS)) {
            const eraNum = parseInt(era);
            if (eraNum > currentEra && solarCapture >= eraData.threshold) {
                this.advanceToEra(eraNum);
            }
        }
    }

    // Advance to a new era
    advanceToEra(era) {
        const eraData = CONFIG.ERAS[era];
        if (!eraData) return;

        this.stateManager.setEra(era);

        // Emit notification
        this.stateManager.emit('notification', {
            type: 'achievement',
            title: `Era ${era}: ${eraData.name}`,
            message: `Welcome to the ${eraData.name} era!`,
            duration: 10000,
        });

        console.log('[ProgressionSystem] Advanced to era:', era, eraData.name);
    }

    // Trigger victory condition
    triggerVictory() {
        this.stateManager.set('flags.victoryAchieved', true);
        this.stateManager.emit('game:victory', {
            stats: this.stateManager.getState().stats,
        });

        console.log('[ProgressionSystem] VICTORY! Kardashev Type 2 achieved!');
    }

    // Get current era info
    getCurrentEra() {
        const era = this.stateManager.getState().currentEra;
        return {
            number: era,
            ...CONFIG.ERAS[era],
        };
    }

    // Get milestone progress
    getMilestoneProgress() {
        const state = this.stateManager.getState();
        const claimed = state.claimedMilestones;
        const total = Object.keys(MILESTONES).length;

        return {
            claimed: claimed.length,
            total,
            percent: claimed.length / total,
            milestones: MILESTONES,
            claimedIds: claimed,
        };
    }
}

// Singleton instance
let instance = null;

export function getProgressionSystem() {
    if (!instance) {
        instance = new ProgressionSystem();
    }
    return instance;
}

export default ProgressionSystem;
