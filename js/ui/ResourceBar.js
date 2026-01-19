// Resource Bar - Top HUD displaying energy, materials, and research

import { formatNumber, formatRate } from '../config.js';
import { getStateManager } from '../core/StateManager.js';

export class ResourceBar {
    constructor() {
        this.stateManager = getStateManager();
        this.container = null;

        // Animation state for smooth number transitions
        this.displayedResources = {
            energy: 0,
            materials: 0,
            research: 0,
        };

        // Rate display update timer
        this.rateUpdateTimer = 0;
        this.rateUpdateInterval = 0.5; // Update rates every 0.5 seconds
    }

    init() {
        this.container = document.getElementById('resource-bar');
        if (!this.container) {
            console.error('[ResourceBar] Container not found');
            return;
        }

        // Create resource displays
        this.createResourceDisplays();

        // Initialize displayed values
        const resources = this.stateManager.getState().resources;
        this.displayedResources.energy = resources.energy;
        this.displayedResources.materials = resources.materials;
        this.displayedResources.research = resources.research;

        // Initial render
        this.render();

        console.log('[ResourceBar] Initialized');
    }

    createResourceDisplays() {
        this.container.innerHTML = `
            <div class="resource-item" data-resource="energy" title="Energy - Powers construction and research">
                <div class="resource-icon energy">⚡</div>
                <div class="resource-info">
                    <div class="resource-value" id="energy-value">0</div>
                    <div class="resource-rate" id="energy-rate">+0/s</div>
                </div>
            </div>
            <div class="resource-item" data-resource="materials" title="Materials - Used for construction">
                <div class="resource-icon materials">🪨</div>
                <div class="resource-info">
                    <div class="resource-value" id="materials-value">0</div>
                    <div class="resource-rate" id="materials-rate">+0/s</div>
                </div>
            </div>
            <div class="resource-item" data-resource="research" title="Research - Unlocks new technologies">
                <div class="resource-icon research">🔬</div>
                <div class="resource-info">
                    <div class="resource-value" id="research-value">0</div>
                    <div class="resource-rate" id="research-rate">+0/s</div>
                </div>
            </div>
        `;
    }

    update(deltaTime) {
        const state = this.stateManager.getState();
        const resources = state.resources;

        // Smooth number transitions
        const lerpSpeed = 10 * deltaTime;

        this.displayedResources.energy = this.lerp(
            this.displayedResources.energy,
            resources.energy,
            lerpSpeed
        );
        this.displayedResources.materials = this.lerp(
            this.displayedResources.materials,
            resources.materials,
            lerpSpeed
        );
        this.displayedResources.research = this.lerp(
            this.displayedResources.research,
            resources.research,
            lerpSpeed
        );

        // Update rate display periodically
        this.rateUpdateTimer += deltaTime;
        if (this.rateUpdateTimer >= this.rateUpdateInterval) {
            this.rateUpdateTimer = 0;
            this.updateRates(state.production);
        }

        // Render updated values
        this.render();
    }

    render() {
        this.updateValue('energy', this.displayedResources.energy);
        this.updateValue('materials', this.displayedResources.materials);
        this.updateValue('research', this.displayedResources.research);
    }

    updateValue(type, value) {
        const valueEl = document.getElementById(`${type}-value`);
        if (valueEl) {
            valueEl.textContent = formatNumber(value);
        }
    }

    updateRates(production) {
        this.updateRate('energy', production.energy);
        this.updateRate('materials', production.materials);
        this.updateRate('research', production.research);
    }

    updateRate(type, rate) {
        const rateEl = document.getElementById(`${type}-rate`);
        if (rateEl) {
            rateEl.textContent = formatRate(rate);
            rateEl.className = `resource-rate ${rate > 0 ? 'positive' : rate < 0 ? 'negative' : ''}`;
        }
    }

    lerp(start, end, t) {
        t = Math.min(1, Math.max(0, t));
        return start + (end - start) * t;
    }

    // Show a resource gain popup effect
    showGainEffect(type, amount) {
        const item = this.container.querySelector(`[data-resource="${type}"]`);
        if (!item) return;

        const rect = item.getBoundingClientRect();

        const popup = document.createElement('div');
        popup.className = `resource-gain ${type}`;
        popup.textContent = `+${formatNumber(amount)}`;
        popup.style.left = `${rect.left + rect.width / 2}px`;
        popup.style.top = `${rect.top}px`;

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 1000);
    }
}

// Singleton instance
let instance = null;

export function getResourceBar() {
    if (!instance) {
        instance = new ResourceBar();
    }
    return instance;
}

export default ResourceBar;
