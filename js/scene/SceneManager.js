// Scene Manager - Three.js scene setup with post-processing (bloom)

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';

export class SceneManager {
    constructor() {
        this.stateManager = getStateManager();

        // Three.js core objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;

        // Post-processing passes
        this.bloomPass = null;

        // Container element
        this.container = null;

        // Quality settings
        this.quality = 'medium';

        // Raycaster for object picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Clickable objects
        this.clickableObjects = [];

        // Bind methods
        this.onResize = this.onResize.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    // Initialize the scene
    init(containerId = 'canvas-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('[SceneManager] Container not found:', containerId);
            return false;
        }

        // Get container dimensions (use fallback if container is hidden)
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND_COLOR);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.SCENE.FOV,
            width / height,
            CONFIG.SCENE.NEAR,
            CONFIG.SCENE.FAR
        );
        this.camera.position.set(0, 100, CONFIG.CAMERA.INITIAL_DISTANCE);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Add canvas to container
        this.container.appendChild(this.renderer.domElement);

        // Defer post-processing setup until we have valid dimensions
        // (container may be hidden initially)
        this.postProcessingInitialized = false;

        // Add ambient light (bright enough to see planets from all angles)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Create starfield background
        this.createStarfield();

        // Add event listeners
        window.addEventListener('resize', this.onResize);
        this.renderer.domElement.addEventListener('click', this.onClick);

        // Apply quality settings
        this.setQuality(this.stateManager.getSetting('graphicsQuality') || 'medium');

        // Listen for quality changes
        this.stateManager.subscribe('setting:change', ({ key, value }) => {
            if (key === 'graphicsQuality') {
                this.setQuality(value);
            }
        });

        console.log('[SceneManager] Initialized');
        return true;
    }

    // Setup post-processing effects
    setupPostProcessing(width, height) {
        // Ensure minimum valid dimensions for framebuffers
        const safeWidth = Math.max(width, 1);
        const safeHeight = Math.max(height, 1);

        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass for glow effects
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(safeWidth, safeHeight),
            1.5,  // Strength
            0.4,  // Radius
            0.85  // Threshold
        );
        this.composer.addPass(this.bloomPass);

        // Output pass for correct color space
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    // Create starfield background
    createStarfield() {
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            // Random position on a sphere
            const radius = 2000 + Math.random() * 3000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Color variation (white to slight blue/yellow)
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                // White stars
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 1;
            } else if (colorVariation < 0.85) {
                // Blue stars
                colors[i * 3] = 0.7;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 1;
            } else {
                // Yellow/orange stars
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.9;
                colors[i * 3 + 2] = 0.7;
            }

            // Size variation
            sizes[i] = 0.5 + Math.random() * 1.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
        });

        const starfield = new THREE.Points(geometry, material);
        starfield.name = 'starfield';
        this.scene.add(starfield);
    }

    // Set graphics quality
    setQuality(quality) {
        this.quality = quality;
        const settings = CONFIG.GRAPHICS[quality.toUpperCase()];

        if (!settings) {
            console.warn('[SceneManager] Unknown quality:', quality);
            return;
        }

        // Adjust bloom
        if (this.bloomPass) {
            this.bloomPass.enabled = settings.bloom;
            if (settings.bloom) {
                this.bloomPass.strength = quality === 'high' ? 1.8 : 1.5;
            }
        }

        // Adjust renderer
        if (quality === 'low') {
            this.renderer.setPixelRatio(1);
        } else {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        console.log('[SceneManager] Quality set to:', quality);
    }

    // Handle window resize
    onResize() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Skip if dimensions are invalid
        if (width === 0 || height === 0) return;

        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(width, height);

        // Update composer and bloom pass resolution (if initialized)
        if (this.postProcessingInitialized) {
            if (this.composer) {
                this.composer.setSize(width, height);
            }
            if (this.bloomPass) {
                this.bloomPass.resolution.set(width, height);
            }
        }
    }

    // Handle click for object selection
    onClick(event) {
        // Only process clicks directly on the canvas, not bubbled from UI elements
        if (event.target !== this.renderer.domElement) {
            return;
        }

        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections with clickable objects
        const intersects = this.raycaster.intersectObjects(this.clickableObjects, true);

        if (intersects.length > 0) {
            const object = this.findClickableParent(intersects[0].object);
            if (object && object.userData.onClick) {
                object.userData.onClick(object);
            }
            this.stateManager.emit('scene:click', { object, intersect: intersects[0] });
        } else {
            this.stateManager.emit('scene:click', { object: null, intersect: null });
        }
    }

    // Find the clickable parent object
    findClickableParent(object) {
        while (object) {
            if (object.userData && object.userData.clickable) {
                return object;
            }
            object = object.parent;
        }
        return null;
    }

    // Register an object as clickable
    registerClickable(object) {
        object.userData.clickable = true;
        this.clickableObjects.push(object);
    }

    // Unregister a clickable object
    unregisterClickable(object) {
        const index = this.clickableObjects.indexOf(object);
        if (index > -1) {
            this.clickableObjects.splice(index, 1);
        }
    }

    // Add object to scene
    add(object) {
        this.scene.add(object);
    }

    // Remove object from scene
    remove(object) {
        this.scene.remove(object);
        this.unregisterClickable(object);
    }

    // Get scene
    getScene() {
        return this.scene;
    }

    // Get camera
    getCamera() {
        return this.camera;
    }

    // Get renderer
    getRenderer() {
        return this.renderer;
    }

    // Render the scene
    render() {
        // Initialize post-processing lazily when container has valid dimensions
        if (!this.postProcessingInitialized && this.container) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            if (width > 0 && height > 0) {
                this.setupPostProcessing(width, height);
                this.postProcessingInitialized = true;
                // Apply current quality setting
                this.setQuality(this.stateManager.getSetting('graphicsQuality') || 'medium');
            }
        }

        if (this.postProcessingInitialized && this.composer && this.bloomPass && this.bloomPass.enabled) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Clean up resources
    dispose() {
        window.removeEventListener('resize', this.onResize);
        this.renderer.domElement.removeEventListener('click', this.onClick);

        // Dispose of geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // Dispose of renderer
        this.renderer.dispose();

        // Remove canvas
        if (this.container && this.renderer.domElement.parentNode) {
            this.container.removeChild(this.renderer.domElement);
        }

        console.log('[SceneManager] Disposed');
    }
}

// Singleton instance
let instance = null;

export function getSceneManager() {
    if (!instance) {
        instance = new SceneManager();
    }
    return instance;
}

export default SceneManager;
