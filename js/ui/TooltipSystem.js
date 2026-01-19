// Tooltip System - Contextual hover information

import { CONFIG } from '../config.js';

export class TooltipSystem {
    constructor() {
        this.tooltip = null;
        this.showTimeout = null;
        this.isVisible = false;

        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    init() {
        this.tooltip = document.getElementById('tooltip');

        if (!this.tooltip) {
            console.error('[TooltipSystem] Tooltip element not found');
            return;
        }

        // Add global mouse move listener for positioning
        document.addEventListener('mousemove', this.onMouseMove);

        // Setup tooltip triggers
        this.setupTooltipTriggers();

        console.log('[TooltipSystem] Initialized');
    }

    setupTooltipTriggers() {
        // Add tooltips to elements with data-tooltip attribute
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            this.registerElement(element, element.dataset.tooltip);
        });

        // Add tooltips to elements with title attribute (convert to data-tooltip)
        document.querySelectorAll('[title]').forEach(element => {
            if (!element.dataset.tooltip) {
                element.dataset.tooltip = element.getAttribute('title');
                element.removeAttribute('title');
            }
        });
    }

    registerElement(element, content) {
        element.addEventListener('mouseenter', () => {
            this.scheduleShow(content, element);
        });

        element.addEventListener('mouseleave', this.onMouseLeave);
    }

    scheduleShow(content, sourceElement) {
        // Clear any pending show
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        // Delay before showing
        this.showTimeout = setTimeout(() => {
            this.show(content, sourceElement);
        }, CONFIG.UI.TOOLTIP_DELAY);
    }

    show(content, sourceElement) {
        if (!this.tooltip) return;

        // Set content
        if (typeof content === 'string') {
            this.tooltip.innerHTML = content;
        } else if (typeof content === 'object') {
            this.tooltip.innerHTML = this.formatTooltipContent(content);
        }

        // Position tooltip
        this.positionTooltip(sourceElement);

        // Show tooltip
        this.tooltip.classList.remove('hidden');
        this.tooltip.classList.add('tooltip-appear');
        this.isVisible = true;
    }

    hide() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        if (this.tooltip) {
            this.tooltip.classList.add('hidden');
            this.tooltip.classList.remove('tooltip-appear');
        }

        this.isVisible = false;
    }

    onMouseMove(e) {
        if (!this.isVisible || !this.tooltip) return;

        // Update position to follow mouse
        const padding = 15;
        let x = e.clientX + padding;
        let y = e.clientY + padding;

        // Keep tooltip in viewport
        const rect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x + rect.width > viewportWidth) {
            x = e.clientX - rect.width - padding;
        }

        if (y + rect.height > viewportHeight) {
            y = e.clientY - rect.height - padding;
        }

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    onMouseLeave() {
        this.hide();
    }

    positionTooltip(sourceElement) {
        if (!this.tooltip || !sourceElement) return;

        const padding = 10;
        const rect = sourceElement.getBoundingClientRect();

        // Default position below the element
        let x = rect.left;
        let y = rect.bottom + padding;

        // Ensure tooltip is in viewport
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;

        // Adjust after measuring
        requestAnimationFrame(() => {
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Horizontal adjustment
            if (tooltipRect.right > viewportWidth) {
                x = viewportWidth - tooltipRect.width - padding;
            }
            if (x < padding) {
                x = padding;
            }

            // Vertical adjustment - flip above if needed
            if (tooltipRect.bottom > viewportHeight) {
                y = rect.top - tooltipRect.height - padding;
            }
            if (y < padding) {
                y = padding;
            }

            this.tooltip.style.left = `${x}px`;
            this.tooltip.style.top = `${y}px`;
        });
    }

    formatTooltipContent(data) {
        let html = '';

        if (data.title) {
            html += `<div class="tooltip-title">${data.title}</div>`;
        }

        if (data.description) {
            html += `<div class="tooltip-desc">${data.description}</div>`;
        }

        if (data.stats) {
            html += '<div class="tooltip-stats">';
            for (const [label, value] of Object.entries(data.stats)) {
                html += `
                    <div class="tooltip-stat">
                        <span class="tooltip-stat-label">${label}</span>
                        <span class="tooltip-stat-value">${value}</span>
                    </div>
                `;
            }
            html += '</div>';
        }

        if (data.cost) {
            html += '<div class="tooltip-cost">';
            html += '<strong>Cost:</strong> ';
            const costs = Object.entries(data.cost).map(([resource, amount]) => {
                const icon = resource === 'energy' ? '⚡' : resource === 'materials' ? '🪨' : '🔬';
                return `${icon} ${amount}`;
            });
            html += costs.join(', ');
            html += '</div>';
        }

        if (data.hint) {
            html += `<div class="tooltip-hint">${data.hint}</div>`;
        }

        return html;
    }

    // Create tooltip for a structure
    showStructureTooltip(structure, element) {
        const content = {
            title: structure.name,
            description: structure.description,
            stats: {},
            cost: structure.cost,
        };

        if (structure.production) {
            if (structure.production.energy) {
                content.stats['Energy'] = `+${structure.production.energy}/s`;
            }
            if (structure.production.materials) {
                content.stats['Materials'] = `+${structure.production.materials}/s`;
            }
            if (structure.production.research) {
                content.stats['Research'] = `+${structure.production.research}/s`;
            }
            if (structure.production.solarCapture) {
                content.stats['Solar Capture'] = `+${(structure.production.solarCapture * 100).toFixed(2)}%`;
            }
        }

        content.stats['Build Time'] = `${structure.buildTime}s`;

        if (structure.limit) {
            content.stats['Build Limit'] = structure.limit;
        }

        this.show(content, element);
    }

    // Create tooltip for a technology
    showTechTooltip(tech, element) {
        const content = {
            title: tech.name,
            description: tech.description,
            stats: {
                'Era': tech.era,
                'Research Cost': tech.cost.research,
            },
        };

        if (tech.prerequisites.length > 0) {
            content.stats['Requires'] = tech.prerequisites.join(', ');
        }

        if (tech.unlocks && tech.unlocks.length > 0) {
            content.hint = `Unlocks: ${tech.unlocks.join(', ')}`;
        }

        this.show(content, element);
    }

    // Create tooltip for a celestial body
    showCelestialTooltip(body, element) {
        const content = {
            title: body.name,
            description: body.data?.description || '',
            stats: {},
        };

        if (body.data?.features) {
            content.stats['Features'] = body.data.features.join(', ');
        }

        if (body.data?.unlockEra) {
            content.stats['Available in Era'] = body.data.unlockEra;
        }

        if (body.data?.bonuses) {
            for (const [bonus, value] of Object.entries(body.data.bonuses)) {
                const formattedBonus = bonus.replace(/([A-Z])/g, ' $1').trim();
                content.stats[formattedBonus] = typeof value === 'number' ? `${value}x` : value;
            }
        }

        this.show(content, element);
    }
}

// Singleton instance
let instance = null;

export function getTooltipSystem() {
    if (!instance) {
        instance = new TooltipSystem();
    }
    return instance;
}

export default TooltipSystem;
