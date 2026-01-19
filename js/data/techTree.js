// Technology Tree Data

export const TECH_TREE = {
    // ===== ERA 1: Early Space =====
    'basic_rocketry': {
        id: 'basic_rocketry',
        name: 'Basic Rocketry',
        description: 'Fundamental rocket propulsion. Enables launching payloads to orbit.',
        icon: '🚀',
        era: 1,
        cost: { research: 0 }, // Starting tech
        unlocked: true,
        unlocks: ['structures:launch_pad'],
        prerequisites: [],
        effects: {
            launchCapability: true,
        },
    },
    'solar_panels': {
        id: 'solar_panels',
        name: 'Solar Panel Technology',
        description: 'Photovoltaic cells for converting sunlight to electricity.',
        icon: '☀️',
        era: 1,
        cost: { research: 50 },
        unlocks: ['structures:solar_collector'],
        prerequisites: ['basic_rocketry'],
        effects: {
            energyGeneration: 1.0,
        },
    },
    'orbital_mechanics': {
        id: 'orbital_mechanics',
        name: 'Orbital Mechanics',
        description: 'Understanding of orbital trajectories and station-keeping.',
        icon: '🛰️',
        era: 1,
        cost: { research: 75 },
        unlocks: ['structures:space_station'],
        prerequisites: ['basic_rocketry'],
        effects: {
            orbitalConstruction: true,
        },
    },
    'material_science': {
        id: 'material_science',
        name: 'Material Science',
        description: 'Advanced materials for space construction.',
        icon: '🔬',
        era: 1,
        cost: { research: 100 },
        unlocks: ['structures:mining_outpost'],
        prerequisites: ['basic_rocketry'],
        effects: {
            constructionEfficiency: 1.1,
        },
    },
    'life_support': {
        id: 'life_support',
        name: 'Life Support Systems',
        description: 'Closed-loop systems for long-term human habitation.',
        icon: '🫁',
        era: 1,
        cost: { research: 150 },
        unlocks: ['structures:habitat_module'],
        prerequisites: ['orbital_mechanics'],
        effects: {
            habitatCapacity: true,
        },
    },

    // ===== ERA 2: Inner System =====
    'ion_propulsion': {
        id: 'ion_propulsion',
        name: 'Ion Propulsion',
        description: 'Efficient electric propulsion for interplanetary travel.',
        icon: '⚡',
        era: 2,
        cost: { research: 300 },
        unlocks: ['structures:cargo_ship'],
        prerequisites: ['solar_panels', 'orbital_mechanics'],
        effects: {
            travelSpeed: 1.5,
            fuelEfficiency: 2.0,
        },
    },
    'asteroid_mining': {
        id: 'asteroid_mining',
        name: 'Asteroid Mining',
        description: 'Techniques for extracting resources from asteroids.',
        icon: '⛏️',
        era: 2,
        cost: { research: 400 },
        unlocks: ['structures:asteroid_miner'],
        prerequisites: ['material_science', 'ion_propulsion'],
        effects: {
            materialProduction: 2.0,
        },
    },
    'rotating_habitats': {
        id: 'rotating_habitats',
        name: 'Rotating Habitats',
        description: 'Spin gravity for large-scale space habitats.',
        icon: '🎡',
        era: 2,
        cost: { research: 500 },
        unlocks: ['structures:oneill_cylinder'],
        prerequisites: ['life_support', 'material_science'],
        effects: {
            habitatSize: 10,
            population: true,
        },
    },
    'automated_construction': {
        id: 'automated_construction',
        name: 'Automated Construction',
        description: 'Robotic systems for autonomous building in space.',
        icon: '🤖',
        era: 2,
        cost: { research: 600 },
        unlocks: ['structures:construction_hub'],
        prerequisites: ['asteroid_mining'],
        effects: {
            buildSpeed: 1.5,
            autonomousBuilding: true,
        },
    },
    'parallel_research': {
        id: 'parallel_research',
        name: 'Parallel Research Labs',
        description: 'Distributed research facilities allow multiple projects simultaneously.',
        icon: '🔬',
        era: 2,
        cost: { research: 450 },
        unlocks: ['research_slot'],
        prerequisites: ['orbital_mechanics', 'material_science'],
        effects: {
            researchSlots: 1,
        },
    },
    'mercury_operations': {
        id: 'mercury_operations',
        name: 'Mercury Operations',
        description: 'Heat-resistant tech for Mercury surface operations.',
        icon: '🌡️',
        era: 2,
        cost: { research: 700 },
        unlocks: ['structures:mercury_base'],
        prerequisites: ['ion_propulsion', 'material_science'],
        effects: {
            mercuryAccess: true,
            solarEfficiency: 1.5,
        },
    },

    // ===== ERA 3: Solar Infrastructure =====
    'solar_collectors_orbital': {
        id: 'solar_collectors_orbital',
        name: 'Orbital Solar Arrays',
        description: 'Massive solar collectors in close solar orbit.',
        icon: '🌞',
        era: 3,
        cost: { research: 1500 },
        unlocks: ['structures:orbital_solar_array'],
        prerequisites: ['mercury_operations', 'automated_construction'],
        effects: {
            energyProduction: 10.0,
        },
    },
    'dyson_swarm_basics': {
        id: 'dyson_swarm_basics',
        name: 'Dyson Swarm Fundamentals',
        description: 'The science of building solar-encircling satellite swarms.',
        icon: '🔅',
        era: 3,
        cost: { research: 2000 },
        unlocks: ['structures:dyson_satellite'],
        prerequisites: ['solar_collectors_orbital'],
        effects: {
            dysonConstruction: true,
        },
    },
    'self_replication': {
        id: 'self_replication',
        name: 'Self-Replicating Systems',
        description: 'Machines that can build copies of themselves.',
        icon: '🔄',
        era: 3,
        cost: { research: 3000 },
        unlocks: ['structures:replicator_hub'],
        prerequisites: ['automated_construction', 'dyson_swarm_basics'],
        effects: {
            productionMultiplier: 2.0,
            exponentialGrowth: true,
        },
    },
    'energy_transmission': {
        id: 'energy_transmission',
        name: 'Wireless Energy Transmission',
        description: 'Beam energy across vast distances without loss.',
        icon: '📡',
        era: 3,
        cost: { research: 2500 },
        unlocks: ['structures:energy_relay'],
        prerequisites: ['solar_collectors_orbital'],
        effects: {
            energyTransfer: 0.99, // 99% efficiency
        },
    },
    'mega_engineering': {
        id: 'mega_engineering',
        name: 'Megastructure Engineering',
        description: 'Engineering principles for planet-scale construction.',
        icon: '🏗️',
        era: 3,
        cost: { research: 4000 },
        unlocks: ['structures:stellar_forge'],
        prerequisites: ['self_replication', 'energy_transmission'],
        effects: {
            megastructureAccess: true,
        },
    },
    'distributed_intelligence': {
        id: 'distributed_intelligence',
        name: 'Distributed Intelligence',
        description: 'AI networks that accelerate research across all facilities.',
        icon: '🧠',
        era: 3,
        cost: { research: 3500 },
        unlocks: ['research_slot'],
        prerequisites: ['self_replication'],
        effects: {
            researchSlots: 1,
            researchEfficiency: 1.25,
        },
    },

    // ===== ERA 4: Type 2 Civilization =====
    'dyson_swarm_advanced': {
        id: 'dyson_swarm_advanced',
        name: 'Advanced Dyson Architecture',
        description: 'Optimized designs for maximum solar capture.',
        icon: '⭐',
        era: 4,
        cost: { research: 10000 },
        unlocks: ['structures:dyson_hub'],
        prerequisites: ['mega_engineering', 'dyson_swarm_basics'],
        effects: {
            dysonEfficiency: 2.0,
        },
    },
    'antimatter_production': {
        id: 'antimatter_production',
        name: 'Antimatter Production',
        description: 'Harness the Suns energy to create antimatter fuel.',
        icon: '💥',
        era: 4,
        cost: { research: 15000 },
        unlocks: ['structures:antimatter_factory'],
        prerequisites: ['dyson_swarm_advanced'],
        effects: {
            antimatterAccess: true,
            energyStorage: 1000,
        },
    },
    'stellar_engineering': {
        id: 'stellar_engineering',
        name: 'Stellar Engineering',
        description: 'Modify the Sun itself for optimal energy output.',
        icon: '🌟',
        era: 4,
        cost: { research: 25000 },
        unlocks: ['structures:starlifter'],
        prerequisites: ['antimatter_production'],
        effects: {
            stellarControl: true,
        },
    },
    'matrioshka_brain': {
        id: 'matrioshka_brain',
        name: 'Matrioshka Brain',
        description: 'Convert the entire solar output into computational substrate.',
        icon: '🧠',
        era: 4,
        cost: { research: 50000 },
        unlocks: ['structures:computation_sphere'],
        prerequisites: ['stellar_engineering', 'dyson_swarm_advanced'],
        effects: {
            ultimateComputation: true,
            victoryCondition: true,
        },
    },
    'k2_completion': {
        id: 'k2_completion',
        name: 'Kardashev Type 2',
        description: 'Complete mastery of solar energy. A new chapter begins.',
        icon: '🏆',
        era: 4,
        cost: { research: 100000 },
        unlocks: ['sandbox_mode'],
        prerequisites: ['matrioshka_brain'],
        effects: {
            victory: true,
        },
    },
};

// Get all techs for an era
export function getTechsByEra(era) {
    return Object.values(TECH_TREE).filter(tech => tech.era === era);
}

// Get available techs (prerequisites met, not yet researched)
export function getAvailableTechs(researchedTechs) {
    return Object.values(TECH_TREE).filter(tech => {
        if (researchedTechs.includes(tech.id)) return false;
        if (tech.unlocked) return true;
        return tech.prerequisites.every(prereq => researchedTechs.includes(prereq));
    });
}

// Calculate research progress percentage
export function getResearchProgress(techId, currentResearch) {
    const tech = TECH_TREE[techId];
    if (!tech) return 0;
    return Math.min(1, currentResearch / tech.cost.research);
}

export default TECH_TREE;
