// Tech Tree Panel - Research tree display and interaction

import { TECH_TREE, getTechsByEra, getAvailableTechs } from '../data/techTree.js';
import { formatNumber } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getProgressionSystem } from '../systems/ProgressionSystem.js';

export class TechTreePanel {
    constructor() {
        this.stateManager = getStateManager();
        this.progressionSystem = null;
        this.container = null;

        // Current filter
        this.currentEraFilter = 'all';
    }

    init() {
        this.progressionSystem = getProgressionSystem();
        this.container = document.getElementById('tech-tree-panel');

        if (!this.container) {
            console.error('[TechTreePanel] Container not found');
            return;
        }

        // Create panel structure
        this.createPanelStructure();

        // Initial render
        this.render();

        // Subscribe to research events
        this.stateManager.subscribe('research:complete', () => {
            this.render();
            this.updateResearchSlotsDisplay();
        });
        this.stateManager.subscribe('research:start', () => this.render());
        this.stateManager.subscribe('research:progress', () => this.updateProgress());
        this.stateManager.subscribe('research:cancel', () => this.render());

        console.log('[TechTreePanel] Initialized');
    }

    updateResearchSlotsDisplay() {
        const state = this.stateManager.getState();
        const slotsEl = this.container.querySelector('#research-slots-count');
        if (slotsEl) {
            slotsEl.textContent = state.maxResearchSlots || 1;
        }
    }

    createPanelStructure() {
        const state = this.stateManager.getState();
        const autoResearch = state.autoResearch || false;
        const maxSlots = state.maxResearchSlots || 1;

        this.container.innerHTML = `
            <div class="research-controls">
                <label class="auto-research-toggle" title="Automatically start next available research">
                    <input type="checkbox" id="auto-research-checkbox" ${autoResearch ? 'checked' : ''}>
                    <span>Auto-Research</span>
                </label>
                <span class="research-slots" title="Research slots available">
                    Slots: <span id="research-slots-count">${maxSlots}</span>
                </span>
            </div>
            <div class="tabs">
                <button class="tab active" data-era="all">All</button>
                <button class="tab" data-era="1">Era 1</button>
                <button class="tab" data-era="2">Era 2</button>
                <button class="tab" data-era="3">Era 3</button>
                <button class="tab" data-era="4">Era 4</button>
            </div>
            <div id="tech-list"></div>
        `;

        // Auto-research checkbox handler
        const autoCheckbox = this.container.querySelector('#auto-research-checkbox');
        if (autoCheckbox) {
            autoCheckbox.addEventListener('change', (e) => {
                this.progressionSystem.setAutoResearch(e.target.checked);
            });
        }

        // Tab click handlers
        this.container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentEraFilter = e.target.dataset.era;
                this.render();
            });
        });
    }

    render() {
        const listEl = this.container.querySelector('#tech-list');
        if (!listEl) return;

        const state = this.stateManager.getState();
        const completedResearch = state.completedResearch;
        const researchQueue = state.researchQueue || [];

        // Get techs to display
        let techs;
        if (this.currentEraFilter === 'all') {
            techs = Object.values(TECH_TREE);
        } else {
            techs = getTechsByEra(parseInt(this.currentEraFilter));
        }

        // Sort by era, then by prerequisites met
        techs.sort((a, b) => {
            if (a.era !== b.era) return a.era - b.era;
            const aAvailable = a.prerequisites.every(p => completedResearch.includes(p));
            const bAvailable = b.prerequisites.every(p => completedResearch.includes(p));
            if (aAvailable !== bAvailable) return bAvailable ? 1 : -1;
            return 0;
        });

        listEl.innerHTML = '';

        for (const tech of techs) {
            const isCompleted = completedResearch.includes(tech.id);
            const isResearching = researchQueue.includes(tech.id);
            const isAvailable = !isCompleted && !isResearching && tech.prerequisites.every(
                prereq => completedResearch.includes(prereq)
            );
            const isLocked = !isCompleted && !isAvailable && !isResearching;

            const node = this.createTechNode(tech, {
                isCompleted,
                isResearching,
                isAvailable,
                isLocked,
            });

            listEl.appendChild(node);
        }
    }

    createTechNode(tech, status) {
        const node = document.createElement('div');
        node.className = 'tech-node';

        if (status.isCompleted) node.classList.add('completed');
        if (status.isResearching) node.classList.add('researching');
        if (status.isAvailable) node.classList.add('available');
        if (status.isLocked) node.classList.add('locked');

        node.dataset.techId = tech.id;

        // Get progress from the progress map for this specific tech
        const state = this.stateManager.getState();
        const progress = status.isResearching ? (state.researchProgressMap?.[tech.id] || 0) : 0;
        const progressPercent = (progress / tech.cost.research) * 100;

        node.innerHTML = `
            <div class="tech-node-header">
                <span class="tech-node-icon">${tech.icon}</span>
                <span class="tech-node-name">${tech.name}</span>
                <span class="tech-node-era era-${tech.era}">Era ${tech.era}</span>
            </div>
            <div class="tech-node-desc">${tech.description}</div>
            ${status.isResearching ? `
                <div class="tech-node-progress">
                    <div class="tech-node-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            ` : ''}
            <div class="tech-node-cost">
                ${status.isCompleted ? '✓ Completed' :
            status.isResearching ? `
                <span class="research-status">Researching... ${progressPercent.toFixed(0)}%</span>
                <button class="cancel-research-btn" data-tech-id="${tech.id}" title="Cancel Research">✕</button>
            ` :
                `<span class="resource-icon research">🔬</span> ${formatNumber(tech.cost.research)}`
        }
            </div>
            ${status.isLocked && tech.prerequisites.length > 0 ? `
                <div class="tech-node-prereq">
                    Requires: ${tech.prerequisites.map(p => TECH_TREE[p]?.name || p).join(', ')}
                </div>
            ` : ''}
        `;

        // Click handler for starting research
        if (status.isAvailable && !status.isResearching) {
            node.addEventListener('click', () => {
                this.startResearch(tech.id);
            });
        }

        // Cancel button handler
        const cancelBtn = node.querySelector('.cancel-research-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cancelResearch(tech.id);
            });
        }

        return node;
    }

    cancelResearch(techId) {
        const success = this.progressionSystem.cancelResearch(techId);
        if (success) {
            this.render();
        }
    }

    startResearch(techId) {
        const success = this.progressionSystem.startResearch(techId);
        if (success) {
            this.render();
        }
    }

    updateProgress() {
        const state = this.stateManager.getState();
        const researchQueue = state.researchQueue || [];
        const progressMap = state.researchProgressMap || {};

        if (researchQueue.length === 0) return;

        // Update progress for each researching tech
        for (const techId of researchQueue) {
            const node = this.container.querySelector(`[data-tech-id="${techId}"]`);
            if (!node) continue;

            const tech = TECH_TREE[techId];
            if (!tech) continue;

            const progress = progressMap[techId] || 0;
            const progressPercent = (progress / tech.cost.research) * 100;

            const progressBar = node.querySelector('.tech-node-progress-fill');
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
            }

            const statusEl = node.querySelector('.research-status');
            if (statusEl) {
                statusEl.textContent = `Researching... ${progressPercent.toFixed(0)}%`;
            }
        }
    }

    update(deltaTime) {
        // Update progress display if researching
        const researchQueue = this.stateManager.getState().researchQueue || [];
        if (researchQueue.length > 0) {
            this.updateProgress();
        }
    }
}

// Singleton instance
let instance = null;

export function getTechTreePanel() {
    if (!instance) {
        instance = new TechTreePanel();
    }
    return instance;
}

export default TechTreePanel;
