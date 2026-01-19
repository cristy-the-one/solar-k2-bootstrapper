// Particle Effects - Energy streams, construction sparks, and visual effects

import * as THREE from 'three';

import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';
import { getSceneManager } from './SceneManager.js';

export class ParticleEffects {
    constructor() {
        this.stateManager = getStateManager();
        this.sceneManager = null;

        // Particle systems
        this.energyStreams = null;
        this.constructionSparks = [];

        // Quality settings
        this.particleCount = CONFIG.GRAPHICS.MEDIUM.particles;

        // Animation time
        this.time = 0;
    }

    init() {
        this.sceneManager = getSceneManager();

        // Create energy stream particles
        this.createEnergyStreams();

        // Listen for construction events for spark effects
        this.stateManager.subscribe('construction:complete', ({ item }) => {
            this.spawnConstructionSparks(item.position);
        });

        // Listen for quality changes
        this.stateManager.subscribe('setting:change', ({ key, value }) => {
            if (key === 'graphicsQuality') {
                this.updateQuality(value);
            }
        });

        console.log('[ParticleEffects] Initialized');
    }

    // Create energy stream particles flowing from Dyson swarm to structures
    createEnergyStreams() {
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const velocities = new Float32Array(this.particleCount * 3);

        // Store velocities for animation
        this.particleVelocities = velocities;
        this.particlePositions = positions;

        for (let i = 0; i < this.particleCount; i++) {
            // Random position around the sun
            const angle = Math.random() * Math.PI * 2;
            const radius = 25 + Math.random() * 10;
            const height = (Math.random() - 0.5) * 10;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            // Yellow-orange energy color
            const t = Math.random();
            colors[i * 3] = 1; // R
            colors[i * 3 + 1] = 0.5 + t * 0.5; // G
            colors[i * 3 + 2] = t * 0.3; // B

            // Random size
            sizes[i] = 0.5 + Math.random() * 1.5;

            // Outward velocity
            const vAngle = angle + (Math.random() - 0.5) * 0.5;
            const speed = 5 + Math.random() * 10;
            velocities[i * 3] = Math.cos(vAngle) * speed;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
            velocities[i * 3 + 2] = Math.sin(vAngle) * speed;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom shader material for glowing particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createGlowTexture() },
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;

                void main() {
                    vec2 uv = gl_PointCoord;
                    float d = distance(uv, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
        });

        this.energyStreams = new THREE.Points(geometry, material);
        this.energyStreams.name = 'energy_streams';
        this.energyStreams.visible = false; // Hidden until Dyson satellites built

        this.sceneManager.add(this.energyStreams);
    }

    // Create glow texture for particles
    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // Spawn construction completion sparks
    spawnConstructionSparks(position) {
        if (!position) {
            // Default to random position in space
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 100
            );
        }

        const sparkCount = 20;
        const positions = new Float32Array(sparkCount * 3);
        const velocities = [];

        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Random outward velocity
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                Math.random() * 15,
                (Math.random() - 0.5) * 20
            ));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
        });

        const sparks = new THREE.Points(geometry, material);
        sparks.userData = {
            velocities,
            lifetime: 0,
            maxLifetime: 1,
        };

        this.constructionSparks.push(sparks);
        this.sceneManager.add(sparks);
    }

    // Update quality settings
    updateQuality(quality) {
        const settings = CONFIG.GRAPHICS[quality.toUpperCase()];
        if (settings) {
            this.particleCount = settings.particles;
            // Would need to recreate particle systems for full quality change
        }
    }

    // Update called every frame
    update(deltaTime) {
        this.time += deltaTime;

        // Update energy streams
        this.updateEnergyStreams(deltaTime);

        // Update construction sparks
        this.updateConstructionSparks(deltaTime);
    }

    // Update energy stream particles
    updateEnergyStreams(deltaTime) {
        if (!this.energyStreams) return;

        // Show streams when there are Dyson satellites
        const dysonCount = this.stateManager.getStructureCount('dyson_satellite');
        this.energyStreams.visible = dysonCount > 0;

        if (!this.energyStreams.visible) return;

        const positions = this.energyStreams.geometry.attributes.position.array;
        const velocities = this.particleVelocities;

        for (let i = 0; i < this.particleCount; i++) {
            // Move particles outward
            positions[i * 3] += velocities[i * 3] * deltaTime;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;

            // Calculate distance from sun
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const distance = Math.sqrt(x * x + y * y + z * z);

            // Reset particles that get too far
            if (distance > 200) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 25 + Math.random() * 5;
                const height = (Math.random() - 0.5) * 5;

                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = height;
                positions[i * 3 + 2] = Math.sin(angle) * radius;

                // New velocity
                const vAngle = angle + (Math.random() - 0.5) * 0.3;
                const speed = 5 + Math.random() * 10;
                velocities[i * 3] = Math.cos(vAngle) * speed;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
                velocities[i * 3 + 2] = Math.sin(vAngle) * speed;
            }
        }

        this.energyStreams.geometry.attributes.position.needsUpdate = true;

        // Update shader time
        if (this.energyStreams.material.uniforms) {
            this.energyStreams.material.uniforms.time.value = this.time;
        }
    }

    // Update construction spark effects
    updateConstructionSparks(deltaTime) {
        for (let i = this.constructionSparks.length - 1; i >= 0; i--) {
            const sparks = this.constructionSparks[i];
            const data = sparks.userData;

            data.lifetime += deltaTime;

            if (data.lifetime >= data.maxLifetime) {
                // Remove expired sparks
                this.sceneManager.remove(sparks);
                sparks.geometry.dispose();
                sparks.material.dispose();
                this.constructionSparks.splice(i, 1);
                continue;
            }

            // Update positions based on velocity
            const positions = sparks.geometry.attributes.position.array;
            const velocities = data.velocities;

            for (let j = 0; j < velocities.length; j++) {
                // Apply gravity
                velocities[j].y -= 20 * deltaTime;

                positions[j * 3] += velocities[j].x * deltaTime;
                positions[j * 3 + 1] += velocities[j].y * deltaTime;
                positions[j * 3 + 2] += velocities[j].z * deltaTime;
            }

            sparks.geometry.attributes.position.needsUpdate = true;

            // Fade out
            const alpha = 1 - (data.lifetime / data.maxLifetime);
            sparks.material.opacity = alpha;
        }
    }

    // Create a burst effect at a position
    createBurst(position, color = 0xffcc00, count = 30) {
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Spherical outward velocity
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 10 + Math.random() * 20;

            velocities.push(new THREE.Vector3(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            ));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color,
            size: 1.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
        });

        const burst = new THREE.Points(geometry, material);
        burst.userData = {
            velocities,
            lifetime: 0,
            maxLifetime: 0.8,
        };

        this.constructionSparks.push(burst);
        this.sceneManager.add(burst);
    }

    // Dispose of resources
    dispose() {
        if (this.energyStreams) {
            this.energyStreams.geometry.dispose();
            this.energyStreams.material.dispose();
            if (this.energyStreams.material.uniforms &&
                this.energyStreams.material.uniforms.pointTexture) {
                this.energyStreams.material.uniforms.pointTexture.value.dispose();
            }
        }

        for (const sparks of this.constructionSparks) {
            sparks.geometry.dispose();
            sparks.material.dispose();
        }

        this.constructionSparks = [];
        console.log('[ParticleEffects] Disposed');
    }
}

// Singleton instance
let instance = null;

export function getParticleEffects() {
    if (!instance) {
        instance = new ParticleEffects();
    }
    return instance;
}

export default ParticleEffects;
