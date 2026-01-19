// Build Menu - Structure selection and construction interface

import { STRUCTURES, STRUCTURE_CATEGORIES, getAvailableStructures } from '../data/structures.js';
import { formatNumber, formatDuration } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getConstructionSystem } from '../systems/ConstructionSystem.js';
import { getResourceSystem } from '../systems/ResourceSystem.js';

export class BuildMenu {
    constructor() {
        this.stateManager = getStateManager();
        this.constructionSystem = null;
        this.resourceSystem = null;
        this.container = null;
        this.queueContainer = null;

        // Current category filter
        this.currentCategory = 'all';
    }

    init() {
        this.constructionSystem = getConstructionSystem();
        this.resourceSystem = getResourceSystem();

        this.container = document.getElementById('build-menu');
        this.queueContainer = document.getElementById('construction-queue');

        if (!this.container) {
            console.error('[BuildMenu] Container not found');
            return;
        }

        // Create panel structure
        this.createPanelStructure();

        // Initial render
        this.render();
        this.renderQueue();

        // Subscribe to events
        this.stateManager.subscribe('structure:built', () => this.render());
        this.stateManager.subscribe('research:complete', () => this.render());
        this.stateManager.subscribe('queue:add', () => this.renderQueue());
        this.stateManager.subscribe('queue:remove', () => this.renderQueue());
        this.stateManager.subscribe('construction:progress', () => this.updateQueueProgress());

        console.log('[BuildMenu] Initialized');
    }

    createPanelStructure() {
        // Create category tabs
        const tabsHtml = `
            <div class="tabs">
                <button class="tab active" data-category="all">All</button>
                ${STRUCTURE_CATEGORIES.map(cat =>
            `<button class="tab" data-category="${cat.id}" title="${cat.name}">${cat.icon}</button>`
        ).join('')}
            </div>
        `;

        this.container.innerHTML = `
            ${tabsHtml}
            <div id="build-list"></div>
        `;

        // Tab click handlers
        this.container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.render();
            });
        });
    }

    render() {
        const listEl = this.container.querySelector('#build-list');
        if (!listEl) return;

        const completedResearch = this.stateManager.getState().completedResearch;
        const structures = this.stateManager.getState().structures;
        const resources = this.stateManager.getState().resources;

        // Get structures to display
        let structureList = Object.values(STRUCTURES);

        // Filter by category
        if (this.currentCategory !== 'all') {
            structureList = structureList.filter(s => s.category === this.currentCategory);
        }

        // Sort by era, then by unlocked status
        structureList.sort((a, b) => {
            const aUnlocked = completedResearch.includes(a.requiresTech);
            const bUnlocked = completedResearch.includes(b.requiresTech);
            if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
            return a.era - b.era;
        });

        listEl.innerHTML = '';

        // Group by category if showing all
        if (this.currentCategory === 'all') {
            const grouped = {};
            for (const structure of structureList) {
                if (!grouped[structure.category]) {
                    grouped[structure.category] = [];
                }
                grouped[structure.category].push(structure);
            }

            for (const [categoryId, categoryStructures] of Object.entries(grouped)) {
                const category = STRUCTURE_CATEGORIES.find(c => c.id === categoryId);
                if (!category || categoryStructures.length === 0) continue;

                const categoryEl = document.createElement('div');
                categoryEl.className = 'build-category';
                categoryEl.innerHTML = `<div class="build-category-header">${category.icon} ${category.name}</div>`;

                for (const structure of categoryStructures) {
                    const item = this.createBuildItem(structure, {
                        unlocked: completedResearch.includes(structure.requiresTech),
                        count: structures[structure.id] || 0,
                        affordable: this.resourceSystem.canAfford(structure.cost),
                        resources,
                    });
                    categoryEl.appendChild(item);
                }

                listEl.appendChild(categoryEl);
            }
        } else {
            for (const structure of structureList) {
                const item = this.createBuildItem(structure, {
                    unlocked: completedResearch.includes(structure.requiresTech),
                    count: structures[structure.id] || 0,
                    affordable: this.resourceSystem.canAfford(structure.cost),
                    resources,
                });
                listEl.appendChild(item);
            }
        }
    }

    createBuildItem(structure, status) {
        const item = document.createElement('div');
        item.className = 'build-item';

        if (!status.unlocked) item.classList.add('locked');
        if (!status.affordable && status.unlocked) item.classList.add('expensive');

        const atLimit = structure.limit !== null && status.count >= structure.limit;

        item.innerHTML = `
            <div class="build-item-header">
                <div class="build-item-icon">${structure.icon}</div>
                <div class="build-item-info">
                    <div class="build-item-name">${structure.name}</div>
                    ${structure.limit !== null ?
                `<div class="build-item-count">${status.count}/${structure.limit}</div>` :
                `<div class="build-item-count">${status.count} built</div>`
            }
                </div>
            </div>
            <div class="build-item-desc">${structure.description}</div>
            <div class="build-item-cost">
                ${Object.entries(structure.cost).map(([resource, amount]) => {
                const affordable = (status.resources[resource] || 0) >= amount;
                return `<span class="cost-item ${affordable ? 'affordable' : 'expensive'}">
                        ${this.getResourceIcon(resource)} ${formatNumber(amount)}
                    </span>`;
            }).join('')}
                <span class="build-time">⏱️ ${formatDuration(structure.buildTime)}</span>
            </div>
            ${!status.unlocked ? `<div class="build-item-locked">🔒 Requires: ${structure.requiresTech}</div>` : ''}
            ${atLimit ? `<div class="build-item-limit">Maximum built</div>` : ''}
        `;

        // Click handler
        if (status.unlocked && status.affordable && !atLimit) {
            item.addEventListener('click', () => {
                this.build(structure.id);
            });
        }

        return item;
    }

    getResourceIcon(resource) {
        switch (resource) {
            case 'energy': return '⚡';
            case 'materials': return '🪨';
            case 'research': return '🔬';
            default: return '?';
        }
    }

    build(structureId) {
        const result = this.constructionSystem.build(structureId);

        if (!result.success) {
            // Show error notification
            let message = 'Cannot build';
            switch (result.reason) {
                case 'cannot_afford': message = 'Not enough resources'; break;
                case 'tech_not_unlocked': message = 'Technology not researched'; break;
                case 'limit_reached': message = 'Build limit reached'; break;
                case 'queue_full': message = 'Construction queue is full'; break;
            }

            this.stateManager.emit('notification', {
                type: 'warning',
                title: 'Cannot Build',
                message,
                duration: 3000,
            });
        }

        this.render();
    }

    renderQueue() {
        if (!this.queueContainer) return;

        const queue = this.constructionSystem.getQueue();
        const queueList = this.queueContainer.querySelector('#queue-list');

        if (queue.length === 0) {
            this.queueContainer.classList.remove('active');
            return;
        }

        this.queueContainer.classList.add('active');

        queueList.innerHTML = '';

        queue.forEach((item, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';

            const progress = (item.progress / item.buildTime) * 100;

            queueItem.innerHTML = `
                <div class="queue-item-icon">${item.icon}</div>
                <div class="queue-item-info">
                    <div class="queue-item-name">${item.name}</div>
                    <div class="queue-item-progress">
                        <div class="queue-item-progress-fill ${index === 0 ? 'progress-animated' : ''}"
                             style="width: ${progress}%"></div>
                    </div>
                </div>
                <button class="queue-item-cancel" data-index="${index}" title="Cancel">✕</button>
            `;

            // Cancel button handler
            queueItem.querySelector('.queue-item-cancel').addEventListener('click', (e) => {
                e.stopPropagation();
                this.constructionSystem.cancel(index);
            });

            queueList.appendChild(queueItem);
        });
    }

    updateQueueProgress() {
        const queue = this.constructionSystem.getQueue();
        if (queue.length === 0) return;

        const firstItem = queue[0];
        const progress = (firstItem.progress / firstItem.buildTime) * 100;

        const progressBar = this.queueContainer.querySelector('.queue-item-progress-fill');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    update(deltaTime) {
        // Periodic UI refresh for affordability
        this.render();
    }
}

// Singleton instance
let instance = null;

export function getBuildMenu() {
    if (!instance) {
        instance = new BuildMenu();
    }
    return instance;
}

export default BuildMenu;
