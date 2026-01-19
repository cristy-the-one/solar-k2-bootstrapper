// Megastructure Renderer - Instanced rendering for Dyson swarm and other structures

import * as THREE from 'three';

import { CONFIG } from '../config.js';
import { STRUCTURES } from '../data/structures.js';
import { getStateManager } from '../core/StateManager.js';
import { getSceneManager } from './SceneManager.js';
import { createMegastructure } from '../entities/Megastructure.js';

export class MegastructureRenderer {
    constructor() {
        this.stateManager = getStateManager();
        this.sceneManager = null;

        // Instanced meshes for Dyson satellites
        this.dysonSwarm = null;
        this.dysonCount = 0;
        this.dysonMatrix = new THREE.Matrix4();
        this.dysonDummy = new THREE.Object3D();

        // Individual structures (non-instanced)
        this.structures = new Map();

        // Animation time
        this.time = 0;

        // Quality setting
        this.maxDysonVisible = CONFIG.GRAPHICS.MEDIUM.maxDysonVisible;
    }

    init() {
        this.sceneManager = getSceneManager();

        // Create Dyson swarm instanced mesh
        this.createDysonSwarm();

        // Listen for structure built events
        this.stateManager.subscribe('structure:built', ({ structureId, total }) => {
            this.onStructureBuilt(structureId, total);
        });

        // Listen for quality changes
        this.stateManager.subscribe('setting:change', ({ key, value }) => {
            if (key === 'graphicsQuality') {
                this.updateQuality(value);
            }
        });

        // Apply current quality
        this.updateQuality(this.stateManager.getSetting('graphicsQuality') || 'medium');

        // Restore existing structures
        this.restoreStructures();

        console.log('[MegastructureRenderer] Initialized');
    }

    // Create the instanced mesh for Dyson satellites
    createDysonSwarm() {
        // Satellite geometry - simple reflective panel
        const geometry = new THREE.BufferGeometry();

        // Create a simple solar sail shape
        const vertices = new Float32Array([
            // Triangle 1
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0, 0.5, 0,
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        // Shiny reflective material
        const material = new THREE.MeshStandardMaterial({
            color: 0xccddff,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide,
            emissive: 0x112244,
            emissiveIntensity: 0.2,
        });

        // Create instanced mesh with max capacity
        this.dysonSwarm = new THREE.InstancedMesh(
            geometry,
            material,
            CONFIG.SUN.TOTAL_SATELLITES_FOR_DYSON
        );

        this.dysonSwarm.name = 'dyson_swarm';
        this.dysonSwarm.count = 0; // Start with none visible
        this.dysonSwarm.frustumCulled = false;

        // Add to scene
        this.sceneManager.add(this.dysonSwarm);
    }

    // Update Dyson swarm count and positions
    updateDysonSwarm() {
        const targetCount = this.stateManager.getStructureCount('dyson_satellite');
        const visibleCount = Math.min(targetCount, this.maxDysonVisible);

        // Update instance count
        this.dysonSwarm.count = visibleCount;
        this.dysonCount = targetCount;

        // Position satellites in a sphere around the sun
        const sunRadius = CONFIG.SUN.RADIUS;
        const swarmRadius = sunRadius * 1.5; // Start just outside sun

        for (let i = 0; i < visibleCount; i++) {
            // Use golden angle for even distribution
            const phi = Math.acos(1 - 2 * (i + 0.5) / visibleCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            // Calculate position on sphere
            const radius = swarmRadius + (i % 10) * 0.5; // Vary radius slightly
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            this.dysonDummy.position.set(x, y, z);

            // Face toward the sun
            this.dysonDummy.lookAt(0, 0, 0);

            // Random slight rotation for variety
            this.dysonDummy.rotation.z = (i * 0.1) % (Math.PI * 2);

            // Scale based on visibility
            const scale = 0.3 + Math.random() * 0.2;
            this.dysonDummy.scale.setScalar(scale);

            this.dysonDummy.updateMatrix();
            this.dysonSwarm.setMatrixAt(i, this.dysonDummy.matrix);
        }

        this.dysonSwarm.instanceMatrix.needsUpdate = true;
    }

    // Handle structure built event
    onStructureBuilt(structureId, total) {
        if (structureId === 'dyson_satellite') {
            // Update Dyson swarm
            this.updateDysonSwarm();
        } else {
            // Create/update other structure visuals
            this.updateStructureVisual(structureId, total);
        }
    }

    // Update visual for non-Dyson structures
    updateStructureVisual(structureId, count) {
        const structureDef = STRUCTURES[structureId];
        if (!structureDef) return;

        // Get or create structure group
        let group = this.structures.get(structureId);

        if (!group) {
            group = new THREE.Group();
            group.name = `structures_${structureId}`;
            this.structures.set(structureId, group);
            this.sceneManager.add(group);
        }

        // Add new structures up to count
        const currentCount = group.children.length;
        const toAdd = count - currentCount;

        for (let i = 0; i < toAdd; i++) {
            const structure = createMegastructure(structureId, {
                id: `${structureId}_${currentCount + i}`,
                name: structureDef.name,
                scale: structureDef.visualScale || 1,
                orbitRadius: this.getOrbitRadiusForPlacement(structureDef.placement),
                orbitSpeed: 0.01 + Math.random() * 0.02,
                orbitAngle: Math.random() * Math.PI * 2,
            });

            structure.init();
            group.add(structure.getObject());
            this.sceneManager.registerClickable(structure.getObject());
        }
    }

    // Get orbit radius based on placement type
    getOrbitRadiusForPlacement(placement) {
        switch (placement) {
            case 'solar_orbit':
                return 25 + Math.random() * 10;
            case 'orbit':
                return 80 + Math.random() * 40; // Near Earth
            case 'asteroid_belt':
                return 130 + Math.random() * 20;
            case 'fleet':
                return 60 + Math.random() * 100;
            case 'dyson_swarm':
                return 22 + Math.random() * 5;
            default:
                return 50 + Math.random() * 50;
        }
    }

    // Restore structures from saved state
    restoreStructures() {
        const state = this.stateManager.getState();

        for (const [structureId, count] of Object.entries(state.structures)) {
            if (count <= 0) continue;

            if (structureId === 'dyson_satellite') {
                this.updateDysonSwarm();
            } else {
                this.updateStructureVisual(structureId, count);
            }
        }
    }

    // Update quality settings
    updateQuality(quality) {
        const settings = CONFIG.GRAPHICS[quality.toUpperCase()];
        if (settings) {
            this.maxDysonVisible = settings.maxDysonVisible;
            this.updateDysonSwarm();
        }
    }

    // Update called every frame
    update(deltaTime) {
        this.time += deltaTime;

        // Slowly rotate the entire Dyson swarm for visual effect
        if (this.dysonSwarm && this.dysonSwarm.count > 0) {
            this.dysonSwarm.rotation.y += deltaTime * 0.01;

            // Subtle pulsing effect on satellites
            const pulse = 1 + Math.sin(this.time * 2) * 0.02;
            this.dysonSwarm.material.emissiveIntensity = 0.2 * pulse;
        }

        // Update individual structures
        for (const group of this.structures.values()) {
            for (const structure of group.children) {
                if (structure.userData && structure.userData.update) {
                    structure.userData.update(deltaTime);
                }
            }
        }
    }

    // Get Dyson swarm coverage percentage
    getDysonCoverage() {
        const total = CONFIG.SUN.TOTAL_SATELLITES_FOR_DYSON;
        return this.dysonCount / total;
    }

    // Get total structure count for visualization
    getVisibleStructureCount() {
        let count = this.dysonSwarm ? this.dysonSwarm.count : 0;

        for (const group of this.structures.values()) {
            count += group.children.length;
        }

        return count;
    }

    // Dispose of resources
    dispose() {
        // Dispose Dyson swarm
        if (this.dysonSwarm) {
            this.dysonSwarm.geometry.dispose();
            this.dysonSwarm.material.dispose();
        }

        // Dispose other structures
        for (const group of this.structures.values()) {
            for (const structure of group.children) {
                if (structure.geometry) structure.geometry.dispose();
                if (structure.material) {
                    if (Array.isArray(structure.material)) {
                        structure.material.forEach(m => m.dispose());
                    } else {
                        structure.material.dispose();
                    }
                }
            }
        }

        this.structures.clear();
        console.log('[MegastructureRenderer] Disposed');
    }
}

// Singleton instance
let instance = null;

export function getMegastructureRenderer() {
    if (!instance) {
        instance = new MegastructureRenderer();
    }
    return instance;
}

export default MegastructureRenderer;
