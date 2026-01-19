// Celestial Body - Base class for Sun, Planets, Moons

import * as THREE from 'three';

export class CelestialBody {
    constructor(data = {}) {
        this.data = data;
        this.id = data.id || 'unknown';
        this.name = data.name || 'Unknown Body';
        this.radius = data.radius || 1;

        // Three.js objects
        this.object = null;
        this.mesh = null;

        // State
        this.isInitialized = false;
    }

    // Initialize the celestial body (to be overridden)
    init() {
        throw new Error('CelestialBody.init() must be implemented by subclass');
    }

    // Update called every frame (to be overridden)
    update(deltaTime, time) {
        // Override in subclass
    }

    // Get the Three.js object
    getObject() {
        return this.object;
    }

    // Get the mesh
    getMesh() {
        return this.mesh;
    }

    // Get world position
    getWorldPosition() {
        const position = new THREE.Vector3();
        if (this.object) {
            this.object.getWorldPosition(position);
        }
        return position;
    }

    // Set position
    setPosition(x, y, z) {
        if (this.object) {
            this.object.position.set(x, y, z);
        }
    }

    // Set visibility
    setVisible(visible) {
        if (this.object) {
            this.object.visible = visible;
        }
    }

    // Get data
    getData() {
        return this.data;
    }

    // Get ID
    getId() {
        return this.id;
    }

    // Get name
    getName() {
        return this.name;
    }

    // Create basic sphere geometry
    createSphere(radius, segments = 32, color = 0xffffff) {
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.2,
        });

        return new THREE.Mesh(geometry, material);
    }

    // Dispose of resources
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }

        if (this.object && this.object !== this.mesh) {
            this.object.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        this.isInitialized = false;
    }
}

export default CelestialBody;
