// Camera Controller - Orbit controls with smooth focus transitions

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getSceneManager } from './SceneManager.js';

export class CameraController {
    constructor() {
        this.stateManager = getStateManager();
        this.sceneManager = null;

        // Controls
        this.controls = null;

        // Focus transition
        this.isFocusing = false;
        this.focusTarget = null;
        this.focusStartPosition = new THREE.Vector3();
        this.focusEndPosition = new THREE.Vector3();
        this.focusStartTarget = new THREE.Vector3();
        this.focusEndTarget = new THREE.Vector3();
        this.focusProgress = 0;
        this.focusDuration = CONFIG.CAMERA.FOCUS_DURATION;

        // Current focus object
        this.currentFocus = null;
    }

    // Initialize the camera controller
    init() {
        this.sceneManager = getSceneManager();
        const camera = this.sceneManager.getCamera();
        const renderer = this.sceneManager.getRenderer();

        // Create orbit controls
        this.controls = new OrbitControls(camera, renderer.domElement);

        // Configure controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = CONFIG.CAMERA.MIN_DISTANCE;
        this.controls.maxDistance = CONFIG.CAMERA.MAX_DISTANCE;
        this.controls.panSpeed = CONFIG.CAMERA.PAN_SPEED;
        this.controls.zoomSpeed = CONFIG.CAMERA.ZOOM_SPEED;
        this.controls.rotateSpeed = 0.8;

        // Limit vertical rotation to avoid flipping
        this.controls.maxPolarAngle = Math.PI * 0.85;
        this.controls.minPolarAngle = Math.PI * 0.15;

        // Set initial target
        this.controls.target.set(0, 0, 0);

        // Prevent OrbitControls from capturing events over UI elements
        // Override the default event handlers to check for UI elements
        const originalOnPointerDown = this.controls.onPointerDown?.bind(this.controls);
        if (this.controls.domElement) {
            this.controls.domElement.addEventListener('pointerdown', (e) => {
                // Check if the pointer is over a UI element
                const uiLayer = document.getElementById('ui-layer');
                if (uiLayer) {
                    const uiElements = uiLayer.querySelectorAll('.side-panel, #top-hud, #bottom-panel, #menu-button, #help-button');
                    for (const el of uiElements) {
                        const rect = el.getBoundingClientRect();
                        if (e.clientX >= rect.left && e.clientX <= rect.right &&
                            e.clientY >= rect.top && e.clientY <= rect.bottom) {
                            // Pointer is over UI, don't let OrbitControls handle it
                            e.stopImmediatePropagation();
                            return;
                        }
                    }
                }
            }, { capture: true });
        }

        // Listen for click events to focus on objects
        this.stateManager.subscribe('scene:click', ({ object }) => {
            if (object && object.userData.focusable) {
                this.focusOn(object);
            }
        });

        console.log('[CameraController] Initialized');
    }

    // Update called every frame
    update(deltaTime) {
        if (!this.controls) return;

        // Handle focus transition
        if (this.isFocusing) {
            this.updateFocusTransition(deltaTime);
        }

        // Update controls
        this.controls.update();
    }

    // Update focus transition animation
    updateFocusTransition(deltaTime) {
        this.focusProgress += (deltaTime * 1000) / this.focusDuration;

        if (this.focusProgress >= 1) {
            // Complete the transition
            this.focusProgress = 1;
            this.isFocusing = false;
        }

        // Easing function (ease-out cubic)
        const t = 1 - Math.pow(1 - this.focusProgress, 3);

        const camera = this.sceneManager.getCamera();

        // Interpolate camera position
        camera.position.lerpVectors(this.focusStartPosition, this.focusEndPosition, t);

        // Interpolate target
        this.controls.target.lerpVectors(this.focusStartTarget, this.focusEndTarget, t);
    }

    // Focus camera on a specific object
    focusOn(object, options = {}) {
        if (!object) return;

        const camera = this.sceneManager.getCamera();

        // Get object position
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);

        // Calculate camera offset based on object size
        let objectRadius = 10;
        if (object.geometry && object.geometry.boundingSphere) {
            object.geometry.computeBoundingSphere();
            objectRadius = object.geometry.boundingSphere.radius;
        } else if (object.userData.radius) {
            objectRadius = object.userData.radius;
        }

        // Calculate desired camera distance
        const distance = options.distance || objectRadius * 4;

        // Calculate camera end position (maintain current angle if possible)
        const currentDirection = new THREE.Vector3()
            .subVectors(camera.position, this.controls.target)
            .normalize();

        const endPosition = new THREE.Vector3()
            .copy(targetPosition)
            .add(currentDirection.multiplyScalar(distance));

        // Start focus transition
        this.focusStartPosition.copy(camera.position);
        this.focusEndPosition.copy(endPosition);
        this.focusStartTarget.copy(this.controls.target);
        this.focusEndTarget.copy(targetPosition);

        this.focusProgress = 0;
        this.isFocusing = true;
        this.focusTarget = object;
        this.currentFocus = object;

        // Emit focus event
        this.stateManager.emit('camera:focus', { object, targetPosition });

        // Update UI state
        this.stateManager.set('ui.focusedPlanet', object.userData.id || object.name);
    }

    // Reset camera to default view
    resetView() {
        const camera = this.sceneManager.getCamera();

        // Animate to default position
        this.focusStartPosition.copy(camera.position);
        this.focusEndPosition.set(0, 100, CONFIG.CAMERA.INITIAL_DISTANCE);
        this.focusStartTarget.copy(this.controls.target);
        this.focusEndTarget.set(0, 0, 0);

        this.focusProgress = 0;
        this.isFocusing = true;
        this.focusTarget = null;
        this.currentFocus = null;

        this.stateManager.set('ui.focusedPlanet', null);
        this.stateManager.emit('camera:reset', {});
    }

    // Get current focus object
    getCurrentFocus() {
        return this.currentFocus;
    }

    // Enable/disable controls
    setEnabled(enabled) {
        if (this.controls) {
            this.controls.enabled = enabled;
        }
    }

    // Get camera position
    getPosition() {
        return this.sceneManager.getCamera().position.clone();
    }

    // Get camera target
    getTarget() {
        return this.controls.target.clone();
    }

    // Set camera position directly
    setPosition(x, y, z) {
        const camera = this.sceneManager.getCamera();
        camera.position.set(x, y, z);
    }

    // Set camera target directly
    setTarget(x, y, z) {
        this.controls.target.set(x, y, z);
    }

    // Get distance to target
    getDistance() {
        const camera = this.sceneManager.getCamera();
        return camera.position.distanceTo(this.controls.target);
    }

    // Zoom in
    zoomIn(amount = 0.1) {
        const camera = this.sceneManager.getCamera();
        const direction = new THREE.Vector3()
            .subVectors(this.controls.target, camera.position)
            .normalize();

        const distance = this.getDistance();
        const newDistance = Math.max(CONFIG.CAMERA.MIN_DISTANCE, distance * (1 - amount));

        camera.position.copy(this.controls.target).sub(direction.multiplyScalar(newDistance));
    }

    // Zoom out
    zoomOut(amount = 0.1) {
        const camera = this.sceneManager.getCamera();
        const direction = new THREE.Vector3()
            .subVectors(this.controls.target, camera.position)
            .normalize();

        const distance = this.getDistance();
        const newDistance = Math.min(CONFIG.CAMERA.MAX_DISTANCE, distance * (1 + amount));

        camera.position.copy(this.controls.target).sub(direction.multiplyScalar(newDistance));
    }

    // Dispose of resources
    dispose() {
        if (this.controls) {
            this.controls.dispose();
        }
        console.log('[CameraController] Disposed');
    }
}

// Singleton instance
let instance = null;

export function getCameraController() {
    if (!instance) {
        instance = new CameraController();
    }
    return instance;
}

export default CameraController;
