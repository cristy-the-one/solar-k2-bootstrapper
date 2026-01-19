// Solar System Builder - Creates planets, orbits, and celestial bodies

import * as THREE from 'three';

import { CONFIG } from '../config.js';
import { PLANETS, ASTEROID_BELT } from '../data/planets.js';
import { getStateManager } from '../core/StateManager.js';
import { getSceneManager } from './SceneManager.js';
import { Sun } from '../entities/Sun.js';
import { Planet } from '../entities/Planet.js';

export class SolarSystemBuilder {
    constructor() {
        this.stateManager = getStateManager();
        this.sceneManager = null;

        // References to created objects
        this.sun = null;
        this.planets = new Map();
        this.orbits = new Map();
        this.asteroidBelt = null;

        // Animation time
        this.time = 0;
    }

    // Initialize and build the solar system
    init() {
        this.sceneManager = getSceneManager();

        // Create the Sun
        this.createSun();

        // Create planets
        this.createPlanets();

        // Create asteroid belt
        this.createAsteroidBelt();

        // Create orbital paths
        if (this.stateManager.getSetting('showOrbits')) {
            this.createOrbitalPaths();
        }

        // Listen for orbit visibility setting
        this.stateManager.subscribe('setting:change', ({ key, value }) => {
            if (key === 'showOrbits') {
                this.setOrbitsVisible(value);
            }
        });

        console.log('[SolarSystemBuilder] Initialized');
    }

    // Create the Sun
    createSun() {
        this.sun = new Sun();
        this.sun.init();
        this.sceneManager.add(this.sun.getObject());
        this.sceneManager.registerClickable(this.sun.getObject());
    }

    // Create all planets
    createPlanets() {
        for (const planetData of PLANETS) {
            const planet = new Planet(planetData);
            planet.init();

            this.planets.set(planetData.id, planet);
            this.sceneManager.add(planet.getObject());
            this.sceneManager.registerClickable(planet.getObject());

            // Create moons if present
            if (planetData.moons) {
                for (const moonData of planetData.moons) {
                    const moon = planet.createMoon(moonData);
                    if (moon) {
                        this.sceneManager.registerClickable(moon);
                    }
                }
            }
        }
    }

    // Create the asteroid belt
    createAsteroidBelt() {
        const asteroidCount = ASTEROID_BELT.density;
        const positions = new Float32Array(asteroidCount * 3);
        const colors = new Float32Array(asteroidCount * 3);
        const sizes = new Float32Array(asteroidCount);

        for (let i = 0; i < asteroidCount; i++) {
            // Random position in the belt
            const radius = ASTEROID_BELT.innerRadius +
                Math.random() * (ASTEROID_BELT.outerRadius - ASTEROID_BELT.innerRadius);
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 5;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            // Random color from palette
            const color = new THREE.Color(
                ASTEROID_BELT.colors[Math.floor(Math.random() * ASTEROID_BELT.colors.length)]
            );
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random size
            sizes[i] = 0.3 + Math.random() * 0.7;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            sizeAttenuation: true,
        });

        this.asteroidBelt = new THREE.Points(geometry, material);
        this.asteroidBelt.name = 'asteroid_belt';
        this.asteroidBelt.userData = {
            id: 'asteroid_belt',
            name: 'Asteroid Belt',
            clickable: true,
            focusable: true,
            radius: (ASTEROID_BELT.innerRadius + ASTEROID_BELT.outerRadius) / 2,
        };

        this.sceneManager.add(this.asteroidBelt);
    }

    // Create orbital path lines
    createOrbitalPaths() {
        for (const planetData of PLANETS) {
            const segments = 128;
            const points = [];

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * planetData.orbitRadius,
                    0,
                    Math.sin(angle) * planetData.orbitRadius
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x334466,
                transparent: true,
                opacity: 0.3,
            });

            const orbit = new THREE.Line(geometry, material);
            orbit.name = `orbit_${planetData.id}`;

            this.orbits.set(planetData.id, orbit);
            this.sceneManager.add(orbit);
        }
    }

    // Set orbital paths visibility
    setOrbitsVisible(visible) {
        for (const orbit of this.orbits.values()) {
            orbit.visible = visible;
        }
    }

    // Update called every frame
    update(deltaTime) {
        this.time += deltaTime;

        // Update Sun
        if (this.sun) {
            this.sun.update(deltaTime);
        }

        // Update planets
        for (const planet of this.planets.values()) {
            planet.update(deltaTime, this.time);
        }

        // Slowly rotate asteroid belt
        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += deltaTime * 0.001;
        }
    }

    // Get the Sun object
    getSun() {
        return this.sun;
    }

    // Get a planet by ID
    getPlanet(id) {
        return this.planets.get(id);
    }

    // Get all planets
    getAllPlanets() {
        return Array.from(this.planets.values());
    }

    // Get celestial body by ID (sun, planet, or moon)
    getCelestialBody(id) {
        if (id === 'sun') return this.sun;
        if (this.planets.has(id)) return this.planets.get(id);

        // Check moons
        for (const planet of this.planets.values()) {
            const moon = planet.getMoon(id);
            if (moon) return moon;
        }

        return null;
    }

    // Dispose of all resources
    dispose() {
        // Dispose sun
        if (this.sun) {
            this.sun.dispose();
        }

        // Dispose planets
        for (const planet of this.planets.values()) {
            planet.dispose();
        }

        // Dispose orbits
        for (const orbit of this.orbits.values()) {
            orbit.geometry.dispose();
            orbit.material.dispose();
        }

        // Dispose asteroid belt
        if (this.asteroidBelt) {
            this.asteroidBelt.geometry.dispose();
            this.asteroidBelt.material.dispose();
        }

        this.planets.clear();
        this.orbits.clear();

        console.log('[SolarSystemBuilder] Disposed');
    }
}

// Singleton instance
let instance = null;

export function getSolarSystemBuilder() {
    if (!instance) {
        instance = new SolarSystemBuilder();
    }
    return instance;
}

export default SolarSystemBuilder;
