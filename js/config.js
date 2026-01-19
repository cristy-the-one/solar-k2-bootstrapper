// Game Configuration Constants

export const CONFIG = {
    // Version for save migration
    VERSION: '1.0.0',

    // Time settings
    TICK_RATE: 60, // Updates per second
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_OFFLINE_HOURS: 24,
    OFFLINE_EFFICIENCY: 0.5, // 50% efficiency while offline

    // Scene settings
    SCENE: {
        FOV: 60,
        NEAR: 0.1,
        FAR: 10000,
        BACKGROUND_COLOR: 0x000011,
    },

    // Sun settings
    SUN: {
        RADIUS: 20,
        SEGMENTS: 64,
        COLOR: 0xffdd44,
        GLOW_COLOR: 0xff8800,
        ENERGY_OUTPUT: 3.8e26, // Watts (real sun output)
        TOTAL_SATELLITES_FOR_DYSON: 10000,
    },

    // Camera settings
    CAMERA: {
        INITIAL_DISTANCE: 200,
        MIN_DISTANCE: 30,
        MAX_DISTANCE: 1000,
        PAN_SPEED: 0.8,
        ZOOM_SPEED: 1.2,
        FOCUS_DURATION: 1000, // ms
    },

    // Graphics quality presets
    GRAPHICS: {
        LOW: {
            shadows: false,
            bloom: false,
            particles: 100,
            orbitSegments: 32,
            planetSegments: 16,
            maxDysonVisible: 1000,
        },
        MEDIUM: {
            shadows: true,
            bloom: true,
            particles: 500,
            orbitSegments: 64,
            planetSegments: 32,
            maxDysonVisible: 5000,
        },
        HIGH: {
            shadows: true,
            bloom: true,
            particles: 2000,
            orbitSegments: 128,
            planetSegments: 64,
            maxDysonVisible: 10000,
        },
    },

    // Resource starting values
    STARTING_RESOURCES: {
        energy: 100,
        materials: 50,
        research: 0,
    },

    // Base production rates (per second)
    BASE_PRODUCTION: {
        energy: 1,
        materials: 0.5,
        research: 0.2,
    },

    // Eras
    ERAS: {
        1: {
            name: 'Early Space',
            color: '#4488ff',
            threshold: 0, // Starting era
        },
        2: {
            name: 'Inner System',
            color: '#44ff88',
            threshold: 0.001, // 0.1% solar capture
        },
        3: {
            name: 'Solar Infrastructure',
            color: '#ffaa44',
            threshold: 0.01, // 1% solar capture
        },
        4: {
            name: 'Type 2 Civilization',
            color: '#ff44aa',
            threshold: 0.1, // 10% solar capture
        },
    },

    // Milestones for achievements
    MILESTONE_THRESHOLDS: {
        solarCapture: [0.0001, 0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0],
        structures: [1, 10, 50, 100, 500, 1000, 5000, 10000],
        research: [1, 5, 10, 25, 50],
    },

    // UI settings
    UI: {
        NOTIFICATION_DURATION: 5000,
        TOOLTIP_DELAY: 300,
        NUMBER_FORMAT_THRESHOLD: 1000000,
    },

    // Tutorial settings
    TUTORIAL: {
        ENABLED_BY_DEFAULT: true,
        STEPS: [
            {
                id: 'welcome',
                title: 'Welcome to the Solar System!',
                content: 'Your goal is to harness the power of our Sun and become a Kardashev Type 2 civilization. Click and drag to rotate the view, scroll to zoom.',
                highlight: null,
            },
            {
                id: 'resources',
                title: 'Resources',
                content: 'You need Energy (yellow), Materials (blue), and Research (purple) to progress. Energy comes from the Sun, materials from mining, and research from labs.',
                highlight: '#resource-bar',
            },
            {
                id: 'build',
                title: 'Building Structures',
                content: 'Use the Build menu on the left to construct structures. Start with a Solar Collector to generate more energy!',
                highlight: '#left-panel',
            },
            {
                id: 'research',
                title: 'Research',
                content: 'Unlock new technologies in the Research panel on the right. Each era brings more powerful structures.',
                highlight: '#right-panel',
            },
            {
                id: 'dyson',
                title: 'The Dyson Swarm',
                content: 'Your ultimate goal: surround the Sun with thousands of satellites to capture all its energy. Watch the Solar Capture meter grow!',
                highlight: '#solar-capture',
            },
        ],
    },
};

// Helper to format large numbers
export function formatNumber(num, decimals = 1) {
    if (num === undefined || num === null) return '0';

    const absNum = Math.abs(num);

    if (absNum >= 1e15) return (num / 1e15).toFixed(decimals) + 'Q';
    if (absNum >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
    if (absNum >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (absNum >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (absNum >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';

    return num.toFixed(decimals);
}

// Format rate with +/- sign
export function formatRate(rate) {
    const sign = rate >= 0 ? '+' : '';
    return sign + formatNumber(rate) + '/s';
}

// Format percentage
export function formatPercent(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
}

// Format time duration
export function formatDuration(seconds) {
    if (seconds < 60) return Math.ceil(seconds) + 's';
    if (seconds < 3600) return Math.ceil(seconds / 60) + 'm';
    if (seconds < 86400) return (seconds / 3600).toFixed(1) + 'h';
    return (seconds / 86400).toFixed(1) + 'd';
}

export default CONFIG;
