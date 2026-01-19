// Milestones and Achievements

export const MILESTONES = {
    // ===== First Steps =====
    'first_launch': {
        id: 'first_launch',
        name: 'First Launch',
        description: 'Build your first launch pad and reach for the stars.',
        icon: '🚀',
        category: 'progress',
        condition: {
            type: 'structure_count',
            structureId: 'launch_pad',
            count: 1,
        },
        reward: {
            energy: 100,
            materials: 50,
        },
        notification: 'The journey of a thousand light-years begins with a single launch!',
    },
    'first_solar': {
        id: 'first_solar',
        name: 'Solar Pioneer',
        description: 'Deploy your first solar collector.',
        icon: '☀️',
        category: 'progress',
        condition: {
            type: 'structure_count',
            structureId: 'solar_collector',
            count: 1,
        },
        reward: {
            energy: 200,
        },
        notification: 'Harnessing the power of the Sun!',
    },
    'first_station': {
        id: 'first_station',
        name: 'Space Station Alpha',
        description: 'Establish your first space station.',
        icon: '🛰️',
        category: 'progress',
        condition: {
            type: 'structure_count',
            structureId: 'space_station',
            count: 1,
        },
        reward: {
            research: 50,
        },
        notification: 'A permanent presence in space established!',
    },
    'first_mining': {
        id: 'first_mining',
        name: 'Space Miner',
        description: 'Begin mining operations in space.',
        icon: '⛏️',
        category: 'progress',
        condition: {
            type: 'structure_count',
            structureId: 'mining_outpost',
            count: 1,
        },
        reward: {
            materials: 200,
        },
        notification: 'The resources of space are now within reach!',
    },
    'first_habitat': {
        id: 'first_habitat',
        name: 'Space Home',
        description: 'Create a habitat for humans in space.',
        icon: '🏠',
        category: 'progress',
        condition: {
            type: 'structure_count',
            structureId: 'habitat_module',
            count: 1,
        },
        reward: {
            energy: 100,
            materials: 100,
        },
        notification: 'Humanity takes another step into the cosmos!',
    },

    // ===== Solar Capture Milestones =====
    'capture_0001': {
        id: 'capture_0001',
        name: 'Solar Spark',
        description: 'Capture 0.01% of the Suns energy.',
        icon: '✨',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.0001,
        },
        reward: {
            research: 100,
        },
        notification: 'A tiny fraction of solar power, but a giant leap for civilization!',
    },
    'capture_001': {
        id: 'capture_001',
        name: 'Solar Glow',
        description: 'Capture 0.1% of the Suns energy.',
        icon: '🔆',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.001,
        },
        reward: {
            energy: 5000,
            research: 200,
        },
        notification: 'One thousandth of the Sun - impressive progress!',
    },
    'capture_01': {
        id: 'capture_01',
        name: 'Solar Dawn',
        description: 'Capture 1% of the Suns energy.',
        icon: '🌅',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.01,
        },
        reward: {
            energy: 20000,
            materials: 10000,
            research: 500,
        },
        notification: 'One percent! The Dyson swarm is taking shape!',
    },
    'capture_05': {
        id: 'capture_05',
        name: 'Solar Rise',
        description: 'Capture 5% of the Suns energy.',
        icon: '🌄',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.05,
        },
        reward: {
            energy: 100000,
            materials: 50000,
        },
        notification: 'Five percent - the swarm grows ever larger!',
    },
    'capture_10': {
        id: 'capture_10',
        name: 'Solar Ascent',
        description: 'Capture 10% of the Suns energy.',
        icon: '☀️',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.1,
        },
        reward: {
            energy: 500000,
            materials: 200000,
            research: 2000,
        },
        notification: 'Ten percent! Type 2 civilization is within sight!',
    },
    'capture_25': {
        id: 'capture_25',
        name: 'Solar Dominion',
        description: 'Capture 25% of the Suns energy.',
        icon: '🌟',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.25,
        },
        reward: {
            energy: 1000000,
            materials: 500000,
        },
        notification: 'A quarter of the Sun! Extraordinary achievement!',
    },
    'capture_50': {
        id: 'capture_50',
        name: 'Solar Mastery',
        description: 'Capture 50% of the Suns energy.',
        icon: '💫',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.5,
        },
        reward: {
            energy: 5000000,
            materials: 2000000,
            research: 10000,
        },
        notification: 'Half the Sun! The Dyson sphere approaches completion!',
    },
    'capture_75': {
        id: 'capture_75',
        name: 'Solar Embrace',
        description: 'Capture 75% of the Suns energy.',
        icon: '🔥',
        category: 'solar',
        condition: {
            type: 'solar_capture',
            percent: 0.75,
        },
        reward: {
            energy: 10000000,
            materials: 5000000,
        },
        notification: 'Three quarters! Almost there!',
    },
    'capture_100': {
        id: 'capture_100',
        name: 'KARDASHEV TYPE 2',
        description: 'Capture 100% of the Suns energy. You are now a Type 2 civilization!',
        icon: '🏆',
        category: 'victory',
        condition: {
            type: 'solar_capture',
            percent: 1.0,
        },
        reward: {
            sandbox_mode: true,
        },
        notification: 'CONGRATULATIONS! You have achieved Kardashev Type 2!',
        isVictory: true,
    },

    // ===== Structure Count Milestones =====
    'structures_10': {
        id: 'structures_10',
        name: 'Builder',
        description: 'Build 10 structures.',
        icon: '🔨',
        category: 'building',
        condition: {
            type: 'total_structures',
            count: 10,
        },
        reward: {
            materials: 500,
        },
        notification: 'Construction is underway!',
    },
    'structures_50': {
        id: 'structures_50',
        name: 'Architect',
        description: 'Build 50 structures.',
        icon: '📐',
        category: 'building',
        condition: {
            type: 'total_structures',
            count: 50,
        },
        reward: {
            materials: 2000,
            energy: 1000,
        },
        notification: 'Your space infrastructure expands!',
    },
    'structures_100': {
        id: 'structures_100',
        name: 'Master Builder',
        description: 'Build 100 structures.',
        icon: '🏛️',
        category: 'building',
        condition: {
            type: 'total_structures',
            count: 100,
        },
        reward: {
            materials: 5000,
            energy: 3000,
        },
        notification: 'A hundred structures dot the solar system!',
    },
    'structures_500': {
        id: 'structures_500',
        name: 'Megabuilder',
        description: 'Build 500 structures.',
        icon: '🌆',
        category: 'building',
        condition: {
            type: 'total_structures',
            count: 500,
        },
        reward: {
            materials: 20000,
            energy: 10000,
        },
        notification: 'Five hundred structures! Industry thrives!',
    },
    'structures_1000': {
        id: 'structures_1000',
        name: 'Cosmic Constructor',
        description: 'Build 1000 structures.',
        icon: '🌌',
        category: 'building',
        condition: {
            type: 'total_structures',
            count: 1000,
        },
        reward: {
            materials: 50000,
            energy: 25000,
            research: 5000,
        },
        notification: 'A thousand structures! The solar system is transformed!',
    },
    'dyson_100': {
        id: 'dyson_100',
        name: 'Swarm Initiate',
        description: 'Deploy 100 Dyson satellites.',
        icon: '🔅',
        category: 'dyson',
        condition: {
            type: 'structure_count',
            structureId: 'dyson_satellite',
            count: 100,
        },
        reward: {
            energy: 10000,
        },
        notification: 'The Dyson swarm begins to take shape!',
    },
    'dyson_1000': {
        id: 'dyson_1000',
        name: 'Swarm Commander',
        description: 'Deploy 1000 Dyson satellites.',
        icon: '⭐',
        category: 'dyson',
        condition: {
            type: 'structure_count',
            structureId: 'dyson_satellite',
            count: 1000,
        },
        reward: {
            energy: 100000,
            materials: 50000,
        },
        notification: 'A thousand satellites orbit the Sun!',
    },
    'dyson_5000': {
        id: 'dyson_5000',
        name: 'Swarm Master',
        description: 'Deploy 5000 Dyson satellites.',
        icon: '🌟',
        category: 'dyson',
        condition: {
            type: 'structure_count',
            structureId: 'dyson_satellite',
            count: 5000,
        },
        reward: {
            energy: 500000,
            materials: 200000,
        },
        notification: 'Five thousand satellites! The swarm darkens the Sun!',
    },
    'dyson_10000': {
        id: 'dyson_10000',
        name: 'Dyson Overlord',
        description: 'Deploy 10000 Dyson satellites.',
        icon: '💫',
        category: 'dyson',
        condition: {
            type: 'structure_count',
            structureId: 'dyson_satellite',
            count: 10000,
        },
        reward: {
            energy: 2000000,
            materials: 1000000,
            research: 50000,
        },
        notification: 'TEN THOUSAND SATELLITES! The Dyson sphere is nearly complete!',
    },

    // ===== Research Milestones =====
    'research_5': {
        id: 'research_5',
        name: 'Scholar',
        description: 'Complete 5 research projects.',
        icon: '📚',
        category: 'research',
        condition: {
            type: 'research_count',
            count: 5,
        },
        reward: {
            research: 200,
        },
        notification: 'Knowledge expands!',
    },
    'research_10': {
        id: 'research_10',
        name: 'Scientist',
        description: 'Complete 10 research projects.',
        icon: '🔬',
        category: 'research',
        condition: {
            type: 'research_count',
            count: 10,
        },
        reward: {
            research: 500,
        },
        notification: 'Scientific progress accelerates!',
    },
    'research_all': {
        id: 'research_all',
        name: 'Omniscient',
        description: 'Complete all research projects.',
        icon: '🎓',
        category: 'research',
        condition: {
            type: 'all_research',
        },
        reward: {
            energy: 1000000,
            materials: 500000,
            research: 100000,
        },
        notification: 'All knowledge is yours!',
    },

    // ===== Era Milestones =====
    'era_2': {
        id: 'era_2',
        name: 'Inner System Pioneer',
        description: 'Enter the Inner System era.',
        icon: '🌍',
        category: 'era',
        condition: {
            type: 'era',
            era: 2,
        },
        reward: {
            energy: 1000,
            materials: 500,
            research: 100,
        },
        notification: 'Welcome to the Inner System era!',
    },
    'era_3': {
        id: 'era_3',
        name: 'Solar Engineer',
        description: 'Enter the Solar Infrastructure era.',
        icon: '☀️',
        category: 'era',
        condition: {
            type: 'era',
            era: 3,
        },
        reward: {
            energy: 10000,
            materials: 5000,
            research: 1000,
        },
        notification: 'Welcome to the Solar Infrastructure era!',
    },
    'era_4': {
        id: 'era_4',
        name: 'Type 2 Initiate',
        description: 'Enter the Type 2 Civilization era.',
        icon: '⭐',
        category: 'era',
        condition: {
            type: 'era',
            era: 4,
        },
        reward: {
            energy: 100000,
            materials: 50000,
            research: 10000,
        },
        notification: 'Welcome to the Type 2 Civilization era!',
    },
};

// Check if milestone condition is met
export function checkMilestoneCondition(milestone, gameState) {
    const condition = milestone.condition;

    switch (condition.type) {
        case 'structure_count':
            return (gameState.structures[condition.structureId] || 0) >= condition.count;

        case 'total_structures':
            const total = Object.values(gameState.structures).reduce((sum, count) => sum + count, 0);
            return total >= condition.count;

        case 'solar_capture':
            return gameState.solarCapture >= condition.percent;

        case 'research_count':
            return gameState.completedResearch.length >= condition.count;

        case 'all_research':
            // Compare against total tech count
            return gameState.completedResearch.length >= gameState.totalTechCount;

        case 'era':
            return gameState.currentEra >= condition.era;

        default:
            return false;
    }
}

// Get unclaimed milestones that are now achievable
export function getNewlyAchievedMilestones(gameState, claimedMilestones) {
    return Object.values(MILESTONES).filter(milestone => {
        if (claimedMilestones.includes(milestone.id)) return false;
        return checkMilestoneCondition(milestone, gameState);
    });
}

// Milestone categories for UI grouping
export const MILESTONE_CATEGORIES = [
    { id: 'progress', name: 'Progress', icon: '📈' },
    { id: 'solar', name: 'Solar Capture', icon: '☀️' },
    { id: 'building', name: 'Building', icon: '🏗️' },
    { id: 'dyson', name: 'Dyson Swarm', icon: '⭐' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'era', name: 'Eras', icon: '🌟' },
    { id: 'victory', name: 'Victory', icon: '🏆' },
];

export default MILESTONES;
