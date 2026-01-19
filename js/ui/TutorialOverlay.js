// Tutorial Overlay - Guided onboarding for new players

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';

export class TutorialOverlay {
    constructor() {
        this.stateManager = getStateManager();

        // DOM elements
        this.overlay = null;
        this.contentEl = null;
        this.progressEl = null;
        this.highlightEl = null;

        // Tutorial state
        this.steps = CONFIG.TUTORIAL.STEPS;
        this.currentStep = 0;
        this.isActive = false;
    }

    init() {
        this.overlay = document.getElementById('tutorial-overlay');
        this.contentEl = document.getElementById('tutorial-content');
        this.progressEl = document.getElementById('tutorial-progress');
        this.highlightEl = document.getElementById('tutorial-highlight');

        if (!this.overlay) {
            console.error('[TutorialOverlay] Overlay element not found');
            return;
        }

        // Setup button handlers
        document.getElementById('tutorial-skip')?.addEventListener('click', () => {
            this.skip();
        });

        document.getElementById('tutorial-next')?.addEventListener('click', () => {
            this.nextStep();
        });

        // Check if tutorial should start
        const settings = this.stateManager.getState().settings;
        if (CONFIG.TUTORIAL.ENABLED_BY_DEFAULT && !settings.tutorialCompleted) {
            // Delay start to let game initialize
            setTimeout(() => {
                this.start();
            }, 1000);
        }

        console.log('[TutorialOverlay] Initialized');
    }

    start() {
        this.currentStep = this.stateManager.getState().settings.tutorialStep || 0;
        this.isActive = true;
        this.overlay.classList.remove('hidden');
        this.showStep(this.currentStep);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;

        // Update content
        this.contentEl.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
        `;

        // Update progress dots
        this.progressEl.innerHTML = '';
        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('div');
            dot.className = `tutorial-dot ${i === stepIndex ? 'active' : ''}`;
            this.progressEl.appendChild(dot);
        }

        // Update highlight
        if (step.highlight) {
            const targetEl = document.querySelector(step.highlight);
            if (targetEl) {
                this.highlightElement(targetEl);
            } else {
                this.hideHighlight();
            }
        } else {
            this.hideHighlight();
        }

        // Update next button text for last step
        const nextBtn = document.getElementById('tutorial-next');
        if (nextBtn) {
            nextBtn.textContent = stepIndex === this.steps.length - 1 ? 'Got it!' : 'Next';
        }

        // Save progress
        this.stateManager.setSetting('tutorialStep', stepIndex);
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;

        this.highlightEl.style.display = 'block';
        this.highlightEl.style.left = `${rect.left - padding}px`;
        this.highlightEl.style.top = `${rect.top - padding}px`;
        this.highlightEl.style.width = `${rect.width + padding * 2}px`;
        this.highlightEl.style.height = `${rect.height + padding * 2}px`;
    }

    hideHighlight() {
        this.highlightEl.style.display = 'none';
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;
        this.overlay.classList.add('hidden');
        this.hideHighlight();

        // Mark tutorial as completed
        this.stateManager.setSetting('tutorialCompleted', true);
        this.stateManager.setSetting('tutorialStep', 0);

        // Show completion notification
        this.stateManager.emit('notification', {
            type: 'success',
            title: 'Tutorial Complete!',
            message: 'You can restart the tutorial anytime from the help button.',
            duration: 5000,
        });

        console.log('[TutorialOverlay] Tutorial completed');
    }

    restart() {
        this.stateManager.setSetting('tutorialCompleted', false);
        this.stateManager.setSetting('tutorialStep', 0);
        this.start();
    }

    // Check if tutorial is active
    isRunning() {
        return this.isActive;
    }

    // Trigger a specific tutorial step by ID
    triggerStep(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index !== -1 && !this.stateManager.getSetting('tutorialCompleted')) {
            this.start();
            this.showStep(index);
        }
    }
}

// Singleton instance
let instance = null;

export function getTutorialOverlay() {
    if (!instance) {
        instance = new TutorialOverlay();
    }
    return instance;
}

export default TutorialOverlay;
