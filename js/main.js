// Solar System Kardashev 2 Bootstrapper - Main Entry Point

// Core systems
import { getGameLoop } from './core/GameLoop.js';
import { getStateManager } from './core/StateManager.js';
import { getSaveSystem } from './core/SaveSystem.js';
import { getTimeManager } from './core/TimeManager.js';

// Scene systems
import { getSceneManager } from './scene/SceneManager.js';
import { getCameraController } from './scene/CameraController.js';
import { getSolarSystemBuilder } from './scene/SolarSystemBuilder.js';
import { getMegastructureRenderer } from './scene/MegastructureRenderer.js';
import { getParticleEffects } from './scene/ParticleEffects.js';

// Game systems
import { getResourceSystem } from './systems/ResourceSystem.js';
import { getProgressionSystem } from './systems/ProgressionSystem.js';
import { getIdleAccumulator } from './systems/IdleAccumulator.js';
import { getConstructionSystem } from './systems/ConstructionSystem.js';

// UI systems
import { getUIManager } from './ui/UIManager.js';

class Game {
    constructor() {
        // Core
        this.gameLoop = null;
        this.stateManager = null;
        this.saveSystem = null;
        this.timeManager = null;

        // Scene
        this.sceneManager = null;
        this.cameraController = null;
        this.solarSystemBuilder = null;
        this.megastructureRenderer = null;
        this.particleEffects = null;

        // Game systems
        this.resourceSystem = null;
        this.progressionSystem = null;
        this.idleAccumulator = null;
        this.constructionSystem = null;

        // UI
        this.uiManager = null;

        // Loading state
        this.loadProgress = 0;
        this.isInitialized = false;
    }

    async init() {
        console.log('[Game] Initializing Solar K2 Bootstrapper...');

        try {
            // Phase 1: Core systems (10%)
            this.updateLoadProgress(5, 'Loading core systems...');
            await this.initCoreSystems();
            this.updateLoadProgress(10);

            // Phase 2: Load saved state (20%)
            this.updateLoadProgress(15, 'Loading save data...');
            await this.loadSavedState();
            this.updateLoadProgress(20);

            // Phase 3: Scene systems (50%)
            this.updateLoadProgress(25, 'Building solar system...');
            await this.initSceneSystems();
            this.updateLoadProgress(50);

            // Phase 4: Game systems (70%)
            this.updateLoadProgress(55, 'Initializing game systems...');
            await this.initGameSystems();
            this.updateLoadProgress(70);

            // Phase 5: UI systems (90%)
            this.updateLoadProgress(75, 'Loading interface...');
            await this.initUISystems();
            this.updateLoadProgress(90);

            // Phase 6: Start game loop (100%)
            this.updateLoadProgress(95, 'Starting game...');
            await this.startGameLoop();
            this.updateLoadProgress(100);

            // Hide loading screen
            this.uiManager.hideLoading();

            this.isInitialized = true;
            console.log('[Game] Initialization complete!');

        } catch (error) {
            console.error('[Game] Initialization failed:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    async initCoreSystems() {
        // State manager must be first
        this.stateManager = getStateManager();

        // Game loop
        this.gameLoop = getGameLoop();

        // Save system
        this.saveSystem = getSaveSystem();

        // Time manager
        this.timeManager = getTimeManager();

        console.log('[Game] Core systems initialized');
    }

    async loadSavedState() {
        // Initialize save system (loads existing save if present)
        const hadSave = this.saveSystem.init();

        // Initialize time manager (calculates offline progress)
        this.timeManager.init();

        if (hadSave) {
            console.log('[Game] Loaded existing save');
        } else {
            console.log('[Game] Starting new game');
        }
    }

    async initSceneSystems() {
        // Scene manager (Three.js setup)
        this.sceneManager = getSceneManager();
        if (!this.sceneManager.init()) {
            throw new Error('Failed to initialize scene manager');
        }

        // Camera controller
        this.cameraController = getCameraController();
        this.cameraController.init();

        // Solar system builder
        this.solarSystemBuilder = getSolarSystemBuilder();
        this.solarSystemBuilder.init();

        // Megastructure renderer
        this.megastructureRenderer = getMegastructureRenderer();
        this.megastructureRenderer.init();

        // Particle effects
        this.particleEffects = getParticleEffects();
        this.particleEffects.init();

        console.log('[Game] Scene systems initialized');
    }

    async initGameSystems() {
        // Resource system
        this.resourceSystem = getResourceSystem();
        this.resourceSystem.init();

        // Construction system
        this.constructionSystem = getConstructionSystem();
        this.constructionSystem.init();

        // Progression system
        this.progressionSystem = getProgressionSystem();
        this.progressionSystem.init();

        // Idle accumulator
        this.idleAccumulator = getIdleAccumulator();
        this.idleAccumulator.init();

        console.log('[Game] Game systems initialized');
    }

    async initUISystems() {
        // UI manager (coordinates all UI components)
        this.uiManager = getUIManager();
        this.uiManager.init();

        // Update initial UI state
        const state = this.stateManager.getState();
        this.stateManager.emit('era:change', { newEra: state.currentEra });
        this.stateManager.emit('solar:capture', { percent: state.solarCapture });

        console.log('[Game] UI systems initialized');
    }

    async startGameLoop() {
        // Register update callbacks
        this.gameLoop.onUpdate((dt) => this.update(dt));
        this.gameLoop.onRender((dt, alpha) => this.render(dt, alpha));

        // Start the loop
        this.gameLoop.start();

        console.log('[Game] Game loop started');
    }

    update(deltaTime) {
        // Update time manager
        const scaledDelta = this.timeManager.update(deltaTime);

        if (this.timeManager.getIsPaused()) return;

        // Update game systems
        this.resourceSystem.update(scaledDelta);
        this.constructionSystem.update(scaledDelta);
        this.progressionSystem.update(scaledDelta);

        // Update scene
        this.solarSystemBuilder.update(scaledDelta);
        this.megastructureRenderer.update(scaledDelta);
        this.particleEffects.update(scaledDelta);

        // Update camera
        this.cameraController.update(scaledDelta);

        // Update UI
        this.uiManager.update(scaledDelta);
    }

    render(deltaTime, alpha) {
        // Render the scene
        this.sceneManager.render();
    }

    updateLoadProgress(progress, message) {
        this.loadProgress = progress;

        const progressEl = document.getElementById('load-progress');
        if (progressEl) {
            progressEl.style.width = `${progress}%`;
        }

        const textEl = document.querySelector('.loading-text');
        if (textEl && message) {
            textEl.textContent = message;
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loader-content">
                    <h1 style="color: #ff6666;">Error</h1>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    // Pause the game
    pause() {
        this.timeManager.pause();
        this.gameLoop.stop();
    }

    // Resume the game
    resume() {
        this.timeManager.resume();
        this.gameLoop.start();
    }

    // Clean up resources
    dispose() {
        this.gameLoop.stop();
        this.sceneManager.dispose();
        this.solarSystemBuilder.dispose();
        this.megastructureRenderer.dispose();
        this.particleEffects.dispose();
        this.cameraController.dispose();
    }
}

// Initialize game when DOM is ready
let game = null;

function startGame() {
    game = new Game();
    game.init();
}

// Check if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}

// Expose game instance for debugging
window.solarK2Game = {
    get game() { return game; },
    get state() { return game?.stateManager?.getState(); },
    pause: () => game?.pause(),
    resume: () => game?.resume(),
    save: () => game?.saveSystem?.save(),
    reset: () => game?.saveSystem?.resetGame(),
};

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Tab hidden - save game
        game?.saveSystem?.save();
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    game?.saveSystem?.save();
});

export default Game;
