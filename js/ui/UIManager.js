// UI Manager - Coordinates all UI components and DOM management

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getSaveSystem } from '../core/SaveSystem.js';
import { getSceneManager } from '../scene/SceneManager.js';
import { getSolarSystemBuilder } from '../scene/SolarSystemBuilder.js';
import { getCameraController } from '../scene/CameraController.js';
import { getResourceBar } from './ResourceBar.js';
import { getTechTreePanel } from './TechTreePanel.js';
import { getBuildMenu } from './BuildMenu.js';
import { getTooltipSystem } from './TooltipSystem.js';
import { getTutorialOverlay } from './TutorialOverlay.js';

export class UIManager {
    constructor() {
        this.stateManager = getStateManager();
        this.saveSystem = null;

        // UI Components
        this.resourceBar = null;
        this.techTreePanel = null;
        this.buildMenu = null;
        this.tooltipSystem = null;
        this.tutorialOverlay = null;

        // DOM Elements
        this.gameContainer = null;
        this.loadingScreen = null;
        this.notificationsContainer = null;
        this.settingsModal = null;
        this.victoryScreen = null;

        // Notification queue
        this.notifications = [];
    }

    init() {
        this.saveSystem = getSaveSystem();

        // Get DOM elements
        this.gameContainer = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.notificationsContainer = document.getElementById('notifications');
        this.settingsModal = document.getElementById('settings-modal');
        this.victoryScreen = document.getElementById('victory-screen');

        // Initialize UI components
        this.resourceBar = getResourceBar();
        this.resourceBar.init();

        this.techTreePanel = getTechTreePanel();
        this.techTreePanel.init();

        this.buildMenu = getBuildMenu();
        this.buildMenu.init();

        this.tooltipSystem = getTooltipSystem();
        this.tooltipSystem.init();

        this.tutorialOverlay = getTutorialOverlay();
        this.tutorialOverlay.init();

        // Setup event listeners
        this.setupEventListeners();

        // Subscribe to state events
        this.setupStateSubscriptions();

        console.log('[UIManager] Initialized');
    }

    setupEventListeners() {
        // Panel toggles
        document.querySelectorAll('.panel-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panelId = e.target.dataset.panel;
                this.togglePanel(panelId);
            });
        });

        // Settings button
        document.getElementById('menu-button')?.addEventListener('click', () => {
            this.showSettings();
        });

        // Help button
        document.getElementById('help-button')?.addEventListener('click', () => {
            this.tutorialOverlay.restart();
        });

        // Settings modal controls
        document.getElementById('close-settings')?.addEventListener('click', () => {
            this.hideSettings();
        });

        document.getElementById('reset-game')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset? All progress will be lost!')) {
                this.saveSystem.resetGame();
                location.reload();
            }
        });

        // Settings inputs
        document.getElementById('graphics-quality')?.addEventListener('change', (e) => {
            this.stateManager.setSetting('graphicsQuality', e.target.value);
        });

        document.getElementById('music-volume')?.addEventListener('input', (e) => {
            this.stateManager.setSetting('musicVolume', parseInt(e.target.value));
        });

        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            this.stateManager.setSetting('sfxVolume', parseInt(e.target.value));
        });

        document.getElementById('show-orbits')?.addEventListener('change', (e) => {
            this.stateManager.setSetting('showOrbits', e.target.checked);
        });

        document.getElementById('auto-save')?.addEventListener('change', (e) => {
            this.stateManager.setSetting('autoSave', e.target.checked);
        });

        // Export/Import save handlers
        document.getElementById('export-save')?.addEventListener('click', () => {
            this.exportSave();
        });

        document.getElementById('import-save')?.addEventListener('click', () => {
            document.getElementById('import-file-input')?.click();
        });

        document.getElementById('import-file-input')?.addEventListener('change', (e) => {
            this.importSave(e);
        });

        // Victory screen buttons
        document.getElementById('continue-playing')?.addEventListener('click', () => {
            this.hideVictory();
        });

        document.getElementById('sandbox-mode')?.addEventListener('click', () => {
            this.stateManager.set('flags.sandboxMode', true);
            this.hideVictory();
        });

        document.getElementById('new-game')?.addEventListener('click', () => {
            if (confirm('Start a new game? Current progress will be lost!')) {
                this.saveSystem.resetGame();
                location.reload();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Planet selector
        document.getElementById('planet-select')?.addEventListener('change', (e) => {
            const targetId = e.target.value;
            if (targetId) {
                this.focusOnCelestialBody(targetId);
                e.target.value = ''; // Reset selector
            }
        });
    }

    // Focus camera on a celestial body by ID
    focusOnCelestialBody(id) {
        const solarSystem = getSolarSystemBuilder();
        const cameraController = getCameraController();

        let targetObject = null;

        if (id === 'sun') {
            const sun = solarSystem.getSun();
            targetObject = sun?.getObject();
        } else {
            const planet = solarSystem.getPlanet(id);
            targetObject = planet?.getObject();
        }

        if (targetObject) {
            cameraController.focusOn(targetObject);
        }
    }

    setupStateSubscriptions() {
        // Notification events
        this.stateManager.subscribe('notification', (data) => {
            this.showNotification(data);
        });

        // Victory event
        this.stateManager.subscribe('game:victory', (data) => {
            this.showVictory(data);
        });

        // Era change
        this.stateManager.subscribe('era:change', ({ newEra }) => {
            this.updateEraDisplay(newEra);
        });

        // Solar capture update
        this.stateManager.subscribe('solar:capture', ({ percent }) => {
            this.updateSolarCapture(percent);
        });

        // Selection change
        this.stateManager.subscribe('state:ui.selectedObject', ({ newValue }) => {
            this.updateSelectionInfo(newValue);
        });

        // Offline progress
        this.stateManager.subscribe('offline:progress', (data) => {
            this.showOfflineProgress(data);
        });
    }

    handleKeyPress(e) {
        // Escape closes modals
        if (e.key === 'Escape') {
            this.hideSettings();
        }

        // B for build menu
        if (e.key === 'b' || e.key === 'B') {
            this.togglePanel('left');
        }

        // R for research
        if (e.key === 'r' || e.key === 'R') {
            this.togglePanel('right');
        }
    }

    togglePanel(panelId) {
        const panel = document.getElementById(`${panelId}-panel`);
        if (panel) {
            panel.classList.toggle('collapsed');
            this.stateManager.set(`ui.panelStates.${panelId}`, !panel.classList.contains('collapsed'));
        }
    }

    showSettings() {
        // Sync settings with current state
        const settings = this.stateManager.getState().settings;

        const qualitySelect = document.getElementById('graphics-quality');
        if (qualitySelect) qualitySelect.value = settings.graphicsQuality;

        const musicVolume = document.getElementById('music-volume');
        if (musicVolume) musicVolume.value = settings.musicVolume;

        const sfxVolume = document.getElementById('sfx-volume');
        if (sfxVolume) sfxVolume.value = settings.sfxVolume;

        const showOrbits = document.getElementById('show-orbits');
        if (showOrbits) showOrbits.checked = settings.showOrbits;

        const autoSave = document.getElementById('auto-save');
        if (autoSave) autoSave.checked = settings.autoSave;

        this.settingsModal?.classList.remove('hidden');
    }

    hideSettings() {
        this.settingsModal?.classList.add('hidden');
    }

    // Export save to JSON file download
    exportSave() {
        const saveData = this.saveSystem.exportSave();
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `solar-k2-save-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.stateManager.emit('notification', {
            type: 'success',
            title: 'Save Exported',
            message: 'Your save file has been downloaded.',
            duration: 3000,
        });
    }

    // Import save from file
    importSave(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                const success = this.saveSystem.importSave(jsonString);

                if (success) {
                    this.stateManager.emit('notification', {
                        type: 'success',
                        title: 'Save Imported',
                        message: 'Your progress has been restored. Reloading...',
                        duration: 2000,
                    });

                    // Reload the page to apply imported save
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    this.stateManager.emit('notification', {
                        type: 'error',
                        title: 'Import Failed',
                        message: 'Invalid save file format.',
                        duration: 4000,
                    });
                }
            } catch (error) {
                console.error('[UIManager] Import error:', error);
                this.stateManager.emit('notification', {
                    type: 'error',
                    title: 'Import Failed',
                    message: 'Could not read save file.',
                    duration: 4000,
                });
            }
        };

        reader.readAsText(file);

        // Reset file input so the same file can be selected again
        event.target.value = '';
    }

    showVictory(data) {
        // Update victory stats
        const statsEl = document.getElementById('victory-stats');
        if (statsEl && data.stats) {
            statsEl.innerHTML = `
                <p>Structures Built: ${data.stats.totalStructuresBuilt}</p>
                <p>Dyson Satellites: ${data.stats.dysonSatellites}</p>
            `;
        }

        this.victoryScreen?.classList.remove('hidden');
    }

    hideVictory() {
        this.victoryScreen?.classList.add('hidden');
    }

    showNotification(data) {
        const notification = document.createElement('div');
        notification.className = `notification ${data.type || ''}`;

        notification.innerHTML = `
            <span class="notification-icon">${data.icon || this.getNotificationIcon(data.type)}</span>
            <div class="notification-content">
                <div class="notification-title">${data.title}</div>
                <div class="notification-message">${data.message}</div>
            </div>
        `;

        this.notificationsContainer?.appendChild(notification);

        // Auto-remove after duration
        const duration = data.duration || CONFIG.UI.NOTIFICATION_DURATION;
        setTimeout(() => {
            notification.classList.add('notification-dismiss');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✗';
            case 'achievement': return '🏆';
            default: return 'ℹ';
        }
    }

    showOfflineProgress(data) {
        const { offlineSeconds, gains } = data;

        // Format time
        let timeStr;
        if (offlineSeconds < 60) {
            timeStr = `${Math.floor(offlineSeconds)} seconds`;
        } else if (offlineSeconds < 3600) {
            timeStr = `${Math.floor(offlineSeconds / 60)} minutes`;
        } else {
            timeStr = `${(offlineSeconds / 3600).toFixed(1)} hours`;
        }

        // Build gains message
        const gainParts = [];
        if (gains.energy > 0) gainParts.push(`+${this.formatNumber(gains.energy)} Energy`);
        if (gains.materials > 0) gainParts.push(`+${this.formatNumber(gains.materials)} Materials`);
        if (gains.research > 0) gainParts.push(`+${this.formatNumber(gains.research)} Research`);

        if (gainParts.length > 0) {
            this.showNotification({
                type: 'success',
                title: 'Welcome Back!',
                message: `While you were away for ${timeStr}: ${gainParts.join(', ')}`,
                duration: 8000,
            });
        }
    }

    updateEraDisplay(era) {
        const eraEl = document.getElementById('current-era');
        const eraData = CONFIG.ERAS[era];

        if (eraEl && eraData) {
            eraEl.textContent = eraData.name;
            eraEl.style.color = eraData.color;
        }
    }

    updateSolarCapture(percent) {
        const fillEl = document.getElementById('capture-progress');
        const textEl = document.getElementById('capture-percent');

        if (fillEl) {
            fillEl.style.width = `${percent * 100}%`;
        }

        if (textEl) {
            textEl.textContent = (percent * 100).toFixed(2) + '%';
        }
    }

    updateSelectionInfo(selection) {
        const infoEl = document.getElementById('selection-info');
        if (!infoEl) return;

        if (!selection) {
            infoEl.innerHTML = '<span class="info-label">Select an object to view details</span>';
            return;
        }

        infoEl.innerHTML = `
            <div class="selection-highlight">
                <div class="selection-icon">${this.getSelectionIcon(selection.type)}</div>
                <div class="selection-details">
                    <h3>${selection.name}</h3>
                    <p>${selection.data?.description || selection.type}</p>
                </div>
            </div>
        `;
    }

    getSelectionIcon(type) {
        switch (type) {
            case 'star': return '☀️';
            case 'planet': return '🌍';
            case 'moon': return '🌙';
            case 'structure': return '🛰️';
            default: return '📍';
        }
    }

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    // Show loading screen
    showLoading(progress = 0) {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('fade-out');
            const progressEl = document.getElementById('load-progress');
            if (progressEl) {
                progressEl.style.width = `${progress}%`;
            }
        }
    }

    // Hide loading screen and show game
    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }

        if (this.gameContainer) {
            this.gameContainer.classList.add('active');
            // Trigger resize now that container is visible and has dimensions
            requestAnimationFrame(() => {
                getSceneManager().onResize();
            });
        }
    }

    // Update called every frame
    update(deltaTime) {
        // Update resource bar
        if (this.resourceBar) {
            this.resourceBar.update(deltaTime);
        }

        // Update tech tree panel
        if (this.techTreePanel) {
            this.techTreePanel.update(deltaTime);
        }

        // Update build menu
        if (this.buildMenu) {
            this.buildMenu.update(deltaTime);
        }
    }
}

// Singleton instance
let instance = null;

export function getUIManager() {
    if (!instance) {
        instance = new UIManager();
    }
    return instance;
}

export default UIManager;
