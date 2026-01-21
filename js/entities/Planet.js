// Planet - Orbiting celestial body with optional moons and rings

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { getStateManager } from '../core/StateManager.js';

export class Planet extends CelestialBody {
    constructor(data) {
        super(data);

        this.stateManager = getStateManager();

        // Orbital parameters
        this.orbitRadius = data.orbitRadius || 100;
        this.orbitSpeed = data.orbitSpeed || 0.01;
        this.rotationSpeed = data.rotationSpeed || 0.01;
        this.tilt = data.tilt || 0;

        // Visual settings
        this.color = data.color || 0x888888;
        this.bands = data.bands || null;
        this.ringsData = data.rings || null;

        // Moons
        this.moons = new Map();
        this.moonsData = data.moons || [];

        // Rings mesh
        this.rings = null;

        // Current orbit angle
        this.orbitAngle = Math.random() * Math.PI * 2;
    }

    init() {
        // Create container group
        this.object = new THREE.Group();
        this.object.name = this.id;

        // Create planet mesh
        this.createPlanetMesh();

        // Create atmosphere (for planets with one)
        if (this.data.features && this.data.features.includes('thick_atmosphere')) {
            this.createAtmosphere();
        }

        // Create rings if present
        if (this.ringsData) {
            this.createRings();
        }

        // Apply tilt
        this.mesh.rotation.z = this.tilt;

        // Set initial position
        this.updateOrbitPosition(0);

        // Setup userData for interaction
        this.object.userData = {
            id: this.id,
            name: this.name,
            type: 'planet',
            clickable: true,
            focusable: true,
            radius: this.radius,
            description: this.data.description,
            era: this.data.unlockEra,
            features: this.data.features,
            bonuses: this.data.bonuses,
            onClick: () => {
                this.stateManager.set('ui.selectedObject', {
                    id: this.id,
                    type: 'planet',
                    name: this.name,
                    data: this.data,
                });
            },
        };

        this.isInitialized = true;
    }

    createPlanetMesh() {
        const segments = 32;
        const geometry = new THREE.SphereGeometry(this.radius, segments, segments);

        let material;
        const texture = this.loadTexture(this.data.texture);

        if (texture) {
            material = new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xffffff,
                emissive: this.color,
                emissiveIntensity: 0.25,
                roughness: 0.8,
                metalness: 0.1,
            });
        } else if (this.bands) {
            // Create banded material for gas giants
            material = this.createBandedMaterial();
        } else {
            // Standard material with emissive for visibility
            material = new THREE.MeshStandardMaterial({
                color: this.color,
                emissive: this.color,
                emissiveIntensity: 0.5, // Strong glow for visibility
                roughness: 0.8,
                metalness: 0.1,
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.name = `${this.id}_mesh`;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.object.add(this.mesh);
    }

    createBandedMaterial() {
        // Create procedural banded texture for gas giants
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = `#${this.color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw bands
        let y = 0;
        for (const band of this.bands) {
            const bandHeight = canvas.height * band.width;
            ctx.fillStyle = `#${band.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(0, y, canvas.width, bandHeight);

            // Add some noise/variation
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
                ctx.fillRect(
                    Math.random() * canvas.width,
                    y + Math.random() * bandHeight,
                    Math.random() * 100 + 50,
                    Math.random() * 5 + 2
                );
            }

            y += bandHeight;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        return new THREE.MeshStandardMaterial({
            map: texture,
            emissive: this.color,
            emissiveIntensity: 0.4, // Strong glow for visibility
            roughness: 0.7,
            metalness: 0.1,
        });
    }

    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(
            this.radius * 1.05,
            32,
            32
        );

        const atmosphereMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = `${this.id}_atmosphere`;
        this.object.add(atmosphere);
    }

    createRings() {
        const innerRadius = this.ringsData.innerRadius;
        const outerRadius = this.ringsData.outerRadius;

        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const texture = this.loadTexture(this.ringsData.texture);
        const proceduralTexture = texture ?? this.createProceduralRingTexture();

        const material = new THREE.MeshStandardMaterial({
            map: proceduralTexture,
            color: this.ringsData.color,
            transparent: true,
            opacity: this.ringsData.opacity,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
        });

        this.rings = new THREE.Mesh(geometry, material);
        this.rings.rotation.x = Math.PI / 2;
        this.rings.name = `${this.id}_rings`;
        this.mesh.add(this.rings);
    }

    createMoon(moonData) {
        const moonGroup = new THREE.Group();
        moonGroup.name = moonData.id;

        const geometry = new THREE.SphereGeometry(moonData.radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: moonData.color,
            emissive: moonData.color,
            emissiveIntensity: 0.5, // Strong glow for visibility
            roughness: 0.9,
            metalness: 0.1,
        });

        const moonMesh = new THREE.Mesh(geometry, material);
        moonMesh.castShadow = true;
        moonMesh.receiveShadow = true;
        moonGroup.add(moonMesh);

        // Store moon data
        moonGroup.userData = {
            id: moonData.id,
            name: moonData.name,
            type: 'moon',
            parentPlanet: this.id,
            clickable: true,
            focusable: true,
            radius: moonData.radius,
            orbitRadius: moonData.orbitRadius,
            orbitSpeed: moonData.orbitSpeed,
            orbitAngle: Math.random() * Math.PI * 2,
            features: moonData.features,
            onClick: () => {
                this.stateManager.set('ui.selectedObject', {
                    id: moonData.id,
                    type: 'moon',
                    name: moonData.name,
                    parent: this.name,
                    data: moonData,
                });
            },
        };

        // Set initial position
        moonGroup.position.set(
            moonData.orbitRadius,
            0,
            0
        );

        this.moons.set(moonData.id, moonGroup);
        this.object.add(moonGroup);

        return moonGroup;
    }

    updateOrbitPosition(time) {
        // Update orbit position
        this.orbitAngle += this.orbitSpeed * 0.016; // Assume ~60fps base

        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;

        this.object.position.set(x, 0, z);
    }

    update(deltaTime, time) {
        // Update orbit
        this.orbitAngle += this.orbitSpeed * deltaTime;

        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;

        this.object.position.set(x, 0, z);

        // Rotate planet
        if (this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        }

        // Update moons
        for (const moon of this.moons.values()) {
            const moonData = moon.userData;
            moonData.orbitAngle += moonData.orbitSpeed * deltaTime;

            const mx = Math.cos(moonData.orbitAngle) * moonData.orbitRadius;
            const mz = Math.sin(moonData.orbitAngle) * moonData.orbitRadius;

            moon.position.set(mx, 0, mz);

            // Rotate moon mesh
            if (moon.children[0]) {
                moon.children[0].rotation.y += deltaTime * 0.5;
            }
        }
    }

    getMoon(moonId) {
        return this.moons.get(moonId);
    }

    getAllMoons() {
        return Array.from(this.moons.values());
    }

    dispose() {
        if (this.mesh && this.mesh.material && this.mesh.material.map) {
            this.mesh.material.map.dispose();
        }
        super.dispose();

        // Dispose rings
        if (this.rings) {
            this.rings.geometry.dispose();
            this.rings.material.dispose();
            if (this.rings.material.map) {
                this.rings.material.map.dispose();
            }
        }

        // Dispose moons
        for (const moon of this.moons.values()) {
            const mesh = moon.children[0];
            if (mesh) {
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        }
        this.moons.clear();
    }

    loadTexture(path) {
        if (!path) {
            return null;
        }

        const texture = new THREE.TextureLoader().load(path);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        if ('colorSpace' in texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
        }
        return texture;
    }

    createProceduralRingTexture() {
        // Create ring texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Create gradient for ring
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(200, 180, 160, 0.0)');
        gradient.addColorStop(0.1, 'rgba(200, 180, 160, 0.8)');
        gradient.addColorStop(0.3, 'rgba(180, 160, 140, 0.5)');
        gradient.addColorStop(0.5, 'rgba(200, 180, 160, 0.7)');
        gradient.addColorStop(0.7, 'rgba(160, 140, 120, 0.4)');
        gradient.addColorStop(0.9, 'rgba(200, 180, 160, 0.6)');
        gradient.addColorStop(1, 'rgba(200, 180, 160, 0.0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some ring gaps
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(256, 0, 20, canvas.height);
        ctx.fillRect(350, 0, 10, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}

export default Planet;
