// Structure Definitions

export const STRUCTURES = {
    // ===== ERA 1: Early Space =====
    'launch_pad': {
        id: 'launch_pad',
        name: 'Launch Pad',
        description: 'Ground-based facility for launching rockets into orbit.',
        icon: '🚀',
        category: 'infrastructure',
        era: 1,
        cost: {
            energy: 50,
            materials: 100,
        },
        buildTime: 10, // seconds
        production: {
            launchCapacity: 1,
        },
        limit: 5, // Max can build
        requiresTech: 'basic_rocketry',
        placement: 'earth',
    },
    'solar_collector': {
        id: 'solar_collector',
        name: 'Solar Collector',
        description: 'Orbital solar panel array. Generates energy from sunlight.',
        icon: '☀️',
        category: 'energy',
        era: 1,
        cost: {
            energy: 20,
            materials: 50,
        },
        buildTime: 5,
        production: {
            energy: 5, // per second
        },
        limit: null, // Unlimited
        requiresTech: 'solar_panels',
        placement: 'orbit',
        visualScale: 1,
    },
    'space_station': {
        id: 'space_station',
        name: 'Space Station',
        description: 'Orbital platform for research and coordination.',
        icon: '🛰️',
        category: 'infrastructure',
        era: 1,
        cost: {
            energy: 100,
            materials: 200,
        },
        buildTime: 30,
        production: {
            research: 1,
        },
        limit: 3,
        requiresTech: 'orbital_mechanics',
        placement: 'orbit',
    },
    'mining_outpost': {
        id: 'mining_outpost',
        name: 'Mining Outpost',
        description: 'Surface facility for extracting raw materials.',
        icon: '⛏️',
        category: 'production',
        era: 1,
        cost: {
            energy: 80,
            materials: 150,
        },
        buildTime: 20,
        production: {
            materials: 3,
        },
        limit: 10,
        requiresTech: 'material_science',
        placement: 'surface',
    },
    'habitat_module': {
        id: 'habitat_module',
        name: 'Habitat Module',
        description: 'Small living quarters for space workers.',
        icon: '🏠',
        category: 'habitat',
        era: 1,
        cost: {
            energy: 60,
            materials: 120,
        },
        buildTime: 15,
        production: {
            population: 10,
        },
        limit: 20,
        requiresTech: 'life_support',
        placement: 'orbit',
    },

    // ===== ERA 2: Inner System =====
    'cargo_ship': {
        id: 'cargo_ship',
        name: 'Cargo Ship',
        description: 'Ion-powered vessel for transporting materials.',
        icon: '🚢',
        category: 'infrastructure',
        era: 2,
        cost: {
            energy: 200,
            materials: 300,
        },
        buildTime: 25,
        production: {
            cargoCapacity: 100,
        },
        limit: 20,
        requiresTech: 'ion_propulsion',
        placement: 'fleet',
    },
    'asteroid_miner': {
        id: 'asteroid_miner',
        name: 'Asteroid Miner',
        description: 'Automated mining vessel for asteroid belt operations.',
        icon: '🪨',
        category: 'production',
        era: 2,
        cost: {
            energy: 300,
            materials: 400,
        },
        buildTime: 35,
        production: {
            materials: 15,
        },
        limit: 50,
        requiresTech: 'asteroid_mining',
        placement: 'asteroid_belt',
    },
    'oneill_cylinder': {
        id: 'oneill_cylinder',
        name: "O'Neill Cylinder",
        description: 'Rotating habitat supporting thousands of residents.',
        icon: '🎡',
        category: 'habitat',
        era: 2,
        cost: {
            energy: 1000,
            materials: 2000,
        },
        buildTime: 120,
        production: {
            population: 1000,
            research: 2,
        },
        limit: 10,
        requiresTech: 'rotating_habitats',
        placement: 'orbit',
        visualScale: 3,
    },
    'construction_hub': {
        id: 'construction_hub',
        name: 'Construction Hub',
        description: 'Automated facility that speeds up all construction.',
        icon: '🏗️',
        category: 'infrastructure',
        era: 2,
        cost: {
            energy: 500,
            materials: 800,
        },
        buildTime: 60,
        production: {
            buildSpeedBonus: 0.1, // +10% per hub
        },
        limit: 5,
        requiresTech: 'automated_construction',
        placement: 'orbit',
    },
    'mercury_base': {
        id: 'mercury_base',
        name: 'Mercury Base',
        description: 'Heat-shielded base on Mercury for close-solar operations.',
        icon: '🌡️',
        category: 'infrastructure',
        era: 2,
        cost: {
            energy: 800,
            materials: 1500,
        },
        buildTime: 90,
        production: {
            energy: 20,
            materials: 5,
        },
        limit: 3,
        requiresTech: 'mercury_operations',
        placement: 'mercury',
    },

    // ===== ERA 3: Solar Infrastructure =====
    'orbital_solar_array': {
        id: 'orbital_solar_array',
        name: 'Orbital Solar Array',
        description: 'Massive solar collector in close solar orbit.',
        icon: '🌞',
        category: 'energy',
        era: 3,
        cost: {
            energy: 2000,
            materials: 3000,
        },
        buildTime: 60,
        production: {
            energy: 100,
        },
        limit: 100,
        requiresTech: 'solar_collectors_orbital',
        placement: 'solar_orbit',
        visualScale: 2,
    },
    'dyson_satellite': {
        id: 'dyson_satellite',
        name: 'Dyson Satellite',
        description: 'Individual satellite for the Dyson swarm. Many are needed.',
        icon: '🔅',
        category: 'dyson',
        era: 3,
        cost: {
            energy: 100,
            materials: 200,
        },
        buildTime: 2,
        production: {
            solarCapture: 0.0001, // 0.01% each
            energy: 50,
        },
        limit: null, // Unlimited - goal is 10,000+
        requiresTech: 'dyson_swarm_basics',
        placement: 'dyson_swarm',
        visualScale: 0.5,
    },
    'replicator_hub': {
        id: 'replicator_hub',
        name: 'Replicator Hub',
        description: 'Self-replicating factory. Doubles production over time.',
        icon: '🔄',
        category: 'production',
        era: 3,
        cost: {
            energy: 5000,
            materials: 8000,
        },
        buildTime: 180,
        production: {
            materials: 50,
            autoConstruction: 1, // Builds 1 structure per minute
        },
        limit: 10,
        requiresTech: 'self_replication',
        placement: 'orbit',
    },
    'energy_relay': {
        id: 'energy_relay',
        name: 'Energy Relay',
        description: 'Beams energy wirelessly across the solar system.',
        icon: '📡',
        category: 'infrastructure',
        era: 3,
        cost: {
            energy: 3000,
            materials: 2000,
        },
        buildTime: 45,
        production: {
            energyEfficiency: 0.05, // +5% energy delivery
        },
        limit: 20,
        requiresTech: 'energy_transmission',
        placement: 'orbit',
    },
    'stellar_forge': {
        id: 'stellar_forge',
        name: 'Stellar Forge',
        description: 'Uses solar heat to manufacture exotic materials.',
        icon: '🔥',
        category: 'production',
        era: 3,
        cost: {
            energy: 10000,
            materials: 5000,
        },
        buildTime: 240,
        production: {
            materials: 100,
            exoticMaterials: 1,
        },
        limit: 5,
        requiresTech: 'mega_engineering',
        placement: 'solar_orbit',
    },

    // ===== ERA 4: Type 2 Civilization =====
    'dyson_hub': {
        id: 'dyson_hub',
        name: 'Dyson Hub',
        description: 'Coordinates thousands of Dyson satellites. Massive energy boost.',
        icon: '⭐',
        category: 'dyson',
        era: 4,
        cost: {
            energy: 50000,
            materials: 30000,
        },
        buildTime: 300,
        production: {
            solarCapture: 0.01, // 1% each
            energy: 5000,
            dysonBonus: 2.0, // Doubles effectiveness of satellites
        },
        limit: 10,
        requiresTech: 'dyson_swarm_advanced',
        placement: 'dyson_swarm',
        visualScale: 3,
    },
    'antimatter_factory': {
        id: 'antimatter_factory',
        name: 'Antimatter Factory',
        description: 'Produces antimatter for ultimate energy storage.',
        icon: '💥',
        category: 'energy',
        era: 4,
        cost: {
            energy: 100000,
            materials: 50000,
        },
        buildTime: 600,
        production: {
            antimatter: 1,
            energyStorage: 10000,
        },
        limit: 5,
        requiresTech: 'antimatter_production',
        placement: 'solar_orbit',
    },
    'starlifter': {
        id: 'starlifter',
        name: 'Starlifter',
        description: 'Extracts matter directly from the Sun.',
        icon: '🌟',
        category: 'production',
        era: 4,
        cost: {
            energy: 200000,
            materials: 100000,
        },
        buildTime: 900,
        production: {
            materials: 1000,
            solarMatter: 10,
        },
        limit: 3,
        requiresTech: 'stellar_engineering',
        placement: 'solar_surface',
    },
    'computation_sphere': {
        id: 'computation_sphere',
        name: 'Computation Sphere',
        description: 'Layer of the Matrioshka brain. Ultimate computation.',
        icon: '🧠',
        category: 'special',
        era: 4,
        cost: {
            energy: 500000,
            materials: 300000,
        },
        buildTime: 1200,
        production: {
            computation: 1000000,
            research: 100,
        },
        limit: 3,
        requiresTech: 'matrioshka_brain',
        placement: 'dyson_swarm',
        visualScale: 5,
    },
};

// Get structures by category
export function getStructuresByCategory(category) {
    return Object.values(STRUCTURES).filter(s => s.category === category);
}

// Get structures by era
export function getStructuresByEra(era) {
    return Object.values(STRUCTURES).filter(s => s.era === era);
}

// Get available structures (tech unlocked)
export function getAvailableStructures(unlockedTechs) {
    return Object.values(STRUCTURES).filter(s =>
        unlockedTechs.includes(s.requiresTech)
    );
}

// Check if can afford structure
export function canAfford(structureId, resources) {
    const structure = STRUCTURES[structureId];
    if (!structure) return false;

    for (const [resource, amount] of Object.entries(structure.cost)) {
        if ((resources[resource] || 0) < amount) return false;
    }
    return true;
}

// Get structure categories
export const STRUCTURE_CATEGORIES = [
    { id: 'energy', name: 'Energy', icon: '⚡' },
    { id: 'production', name: 'Production', icon: '⛏️' },
    { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
    { id: 'habitat', name: 'Habitats', icon: '🏠' },
    { id: 'dyson', name: 'Dyson Swarm', icon: '☀️' },
    { id: 'special', name: 'Special', icon: '⭐' },
];

export default STRUCTURES;
