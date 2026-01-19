// Megastructure - Base class for Dyson satellites, habitats, and other structures

import * as THREE from 'three';
import { getStateManager } from '../core/StateManager.js';

export class Megastructure {
    constructor(data) {
        this.data = data;
        this.id = data.id;
        this.type = data.type || 'generic';
        this.name = data.name || 'Unknown Structure';

        this.stateManager = getStateManager();

        // Three.js object
        this.object = null;
        this.mesh = null;

        // Position
        this.position = data.position || new THREE.Vector3();
        this.orbitRadius = data.orbitRadius || 30;
        this.orbitSpeed = data.orbitSpeed || 0.001;
        this.orbitAngle = data.orbitAngle || Math.random() * Math.PI * 2;

        // Visual scale
        this.scale = data.scale || 1;
    }

    init() {
        // Override in subclasses
        this.createMesh();
        this.setupInteraction();
    }

    createMesh() {
        // Default simple mesh - override in subclasses
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x88aaff,
            metalness: 0.5,
            roughness: 0.3,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.setScalar(this.scale);
        this.object = this.mesh;
    }

    setupInteraction() {
        if (!this.object) return;

        this.object.userData = {
            id: this.id,
            name: this.name,
            type: 'structure',
            structureType: this.type,
            clickable: true,
            focusable: true,
            data: this.data,
            onClick: () => {
                this.stateManager.set('ui.selectedObject', {
                    id: this.id,
                    type: 'structure',
                    structureType: this.type,
                    name: this.name,
                    data: this.data,
                });
            },
        };
    }

    update(deltaTime) {
        // Update orbit position
        this.orbitAngle += this.orbitSpeed * deltaTime;

        if (this.object) {
            const x = Math.cos(this.orbitAngle) * this.orbitRadius;
            const z = Math.sin(this.orbitAngle) * this.orbitRadius;
            this.object.position.set(x, 0, z);
        }
    }

    getObject() {
        return this.object;
    }

    setPosition(x, y, z) {
        if (this.object) {
            this.object.position.set(x, y, z);
        }
    }

    setVisible(visible) {
        if (this.object) {
            this.object.visible = visible;
        }
    }

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
    }
}

// Solar Collector structure
export class SolarCollector extends Megastructure {
    constructor(data) {
        super({
            ...data,
            type: 'solar_collector',
            name: data.name || 'Solar Collector',
        });
    }

    createMesh() {
        const group = new THREE.Group();

        // Panel
        const panelGeometry = new THREE.PlaneGeometry(2, 3);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            metalness: 0.8,
            roughness: 0.2,
            side: THREE.DoubleSide,
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.scale.setScalar(this.scale);

        // Frame
        const frameGeometry = new THREE.BoxGeometry(0.1, 3.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.3,
        });
        const frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
        frame1.position.x = -1;
        frame1.scale.setScalar(this.scale);
        const frame2 = frame1.clone();
        frame2.position.x = 1;

        group.add(panel);
        group.add(frame1);
        group.add(frame2);

        // Make it face the sun
        group.lookAt(0, 0, 0);

        this.mesh = group;
        this.object = group;
    }
}

// O'Neill Cylinder habitat
export class ONeillCylinder extends Megastructure {
    constructor(data) {
        super({
            ...data,
            type: 'oneill_cylinder',
            name: data.name || "O'Neill Cylinder",
        });
        this.rotationSpeed = 0.5;
    }

    createMesh() {
        const group = new THREE.Group();

        // Main cylinder
        const cylinderGeometry = new THREE.CylinderGeometry(2, 2, 8, 32, 1, true);
        const cylinderMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.6,
            roughness: 0.4,
            side: THREE.DoubleSide,
        });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.rotation.z = Math.PI / 2;
        cylinder.scale.setScalar(this.scale);

        // End caps
        const capGeometry = new THREE.CircleGeometry(2, 32);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            metalness: 0.3,
            roughness: 0.5,
            transparent: true,
            opacity: 0.7,
        });

        const cap1 = new THREE.Mesh(capGeometry, capMaterial);
        cap1.position.x = 4 * this.scale;
        cap1.rotation.y = Math.PI / 2;
        cap1.scale.setScalar(this.scale);

        const cap2 = cap1.clone();
        cap2.position.x = -4 * this.scale;
        cap2.rotation.y = -Math.PI / 2;

        group.add(cylinder);
        group.add(cap1);
        group.add(cap2);

        this.mesh = group;
        this.object = group;
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Spin the cylinder
        if (this.mesh && this.mesh.children[0]) {
            this.mesh.children[0].rotation.x += this.rotationSpeed * deltaTime;
        }
    }
}

// Space Station
export class SpaceStation extends Megastructure {
    constructor(data) {
        super({
            ...data,
            type: 'space_station',
            name: data.name || 'Space Station',
        });
    }

    createMesh() {
        const group = new THREE.Group();

        // Central hub
        const hubGeometry = new THREE.SphereGeometry(1, 16, 16);
        const hubMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.7,
            roughness: 0.3,
        });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.scale.setScalar(this.scale);

        // Solar arrays
        const arrayGeometry = new THREE.PlaneGeometry(4, 1);
        const arrayMaterial = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            metalness: 0.8,
            roughness: 0.2,
            side: THREE.DoubleSide,
        });

        const array1 = new THREE.Mesh(arrayGeometry, arrayMaterial);
        array1.position.x = 3 * this.scale;
        array1.scale.setScalar(this.scale);

        const array2 = array1.clone();
        array2.position.x = -3 * this.scale;

        // Modules
        const moduleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const moduleMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.5,
            roughness: 0.4,
        });

        for (let i = 0; i < 4; i++) {
            const module = new THREE.Mesh(moduleGeometry, moduleMaterial);
            const angle = (i / 4) * Math.PI * 2;
            module.position.x = Math.cos(angle) * 1.5 * this.scale;
            module.position.z = Math.sin(angle) * 1.5 * this.scale;
            module.rotation.z = Math.PI / 2;
            module.rotation.y = angle;
            module.scale.setScalar(this.scale);
            group.add(module);
        }

        group.add(hub);
        group.add(array1);
        group.add(array2);

        this.mesh = group;
        this.object = group;
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Slow rotation
        if (this.object) {
            this.object.rotation.y += deltaTime * 0.1;
        }
    }
}

// Mining Outpost
export class MiningOutpost extends Megastructure {
    constructor(data) {
        super({
            ...data,
            type: 'mining_outpost',
            name: data.name || 'Mining Outpost',
        });
    }

    createMesh() {
        const group = new THREE.Group();

        // Main structure
        const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x887766,
            metalness: 0.4,
            roughness: 0.7,
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.scale.setScalar(this.scale);

        // Drill tower
        const towerGeometry = new THREE.CylinderGeometry(0.2, 0.4, 3, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.3,
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 2 * this.scale;
        tower.scale.setScalar(this.scale);

        group.add(base);
        group.add(tower);

        this.mesh = group;
        this.object = group;
    }
}

// Factory for creating megastructures
export function createMegastructure(type, data) {
    switch (type) {
        case 'solar_collector':
            return new SolarCollector(data);
        case 'oneill_cylinder':
            return new ONeillCylinder(data);
        case 'space_station':
            return new SpaceStation(data);
        case 'mining_outpost':
            return new MiningOutpost(data);
        default:
            return new Megastructure(data);
    }
}

export default Megastructure;
