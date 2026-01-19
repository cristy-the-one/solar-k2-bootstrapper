// Sun - Glowing star at the center of the solar system

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { CONFIG } from '../config.js';
import { getStateManager } from '../core/StateManager.js';

export class Sun extends CelestialBody {
    constructor() {
        super({
            id: 'sun',
            name: 'The Sun',
            radius: CONFIG.SUN.RADIUS,
        });

        this.stateManager = getStateManager();

        // Glow layers
        this.glowMesh = null;
        this.coronaMesh = null;

        // Light
        this.pointLight = null;

        // Animation
        this.pulseTime = 0;
    }

    init() {
        // Create container
        this.object = new THREE.Group();
        this.object.name = 'sun';

        // Create main sun sphere
        this.createSunSphere();

        // Create glow effect
        this.createGlow();

        // Create corona effect
        this.createCorona();

        // Create point light
        this.createLight();

        // Setup userData for interaction
        this.object.userData = {
            id: 'sun',
            name: 'The Sun',
            type: 'star',
            clickable: true,
            focusable: true,
            radius: this.radius,
            description: 'Our home star. Source of all energy in the solar system.',
            onClick: () => {
                this.stateManager.set('ui.selectedObject', {
                    id: 'sun',
                    type: 'star',
                    name: 'The Sun',
                });
            },
        };

        this.isInitialized = true;
    }

    createSunSphere() {
        const geometry = new THREE.SphereGeometry(
            this.radius,
            CONFIG.SUN.SEGMENTS,
            CONFIG.SUN.SEGMENTS
        );

        // Custom shader material for animated surface
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0xffee44) },
                color2: { value: new THREE.Color(0xff8800) },
                color3: { value: new THREE.Color(0xff4400) },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vViewDir;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    // Calculate view direction in view space
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewDir = normalize(-mvPosition.xyz);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;

                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vViewDir;

                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);

                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);

                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                void main() {
                    // Create animated noise pattern
                    vec3 pos = vec3(vUv * 5.0, time * 0.1);
                    float noise1 = snoise(pos) * 0.5 + 0.5;
                    float noise2 = snoise(pos * 2.0 + 100.0) * 0.5 + 0.5;

                    // Mix colors based on noise
                    vec3 color = mix(color1, color2, noise1);
                    color = mix(color, color3, noise2 * 0.3);

                    // Add bright spots
                    float spots = snoise(pos * 3.0 + vec3(time * 0.2, 0.0, 0.0));
                    spots = pow(max(spots, 0.0), 3.0);
                    color += vec3(1.0, 0.9, 0.7) * spots * 0.5;

                    // Edge glow - use actual view direction
                    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.0);
                    color += color2 * fresnel * 0.3;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.name = 'sun_surface';
        this.object.add(this.mesh);
    }

    createGlow() {
        // Inner glow
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.2, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xff8800) },
            },
            vertexShader: `
                varying float intensity;

                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vec3 viewDir = normalize(-mvPosition.xyz);
                    intensity = pow(0.8 - dot(vNormal, viewDir), 2.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;

                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.6);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.name = 'sun_glow';
        this.object.add(this.glowMesh);
    }

    createCorona() {
        // Outer corona
        const coronaGeometry = new THREE.SphereGeometry(this.radius * 1.8, 32, 32);
        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xff6600) },
            },
            vertexShader: `
                varying float intensity;

                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vec3 viewDir = normalize(-mvPosition.xyz);
                    intensity = pow(0.6 - dot(vNormal, viewDir), 2.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;

                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.3);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });

        this.coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.coronaMesh.name = 'sun_corona';
        this.object.add(this.coronaMesh);
    }

    createLight() {
        // Point light for illuminating planets
        this.pointLight = new THREE.PointLight(0xffffee, 2, 1000);
        this.pointLight.position.set(0, 0, 0);
        this.object.add(this.pointLight);
    }

    update(deltaTime) {
        this.pulseTime += deltaTime;

        // Update sun surface shader
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = this.pulseTime;
        }

        // Gentle pulse animation
        const pulse = 1 + Math.sin(this.pulseTime * 0.5) * 0.02;
        if (this.glowMesh) {
            this.glowMesh.scale.setScalar(pulse);
        }

        // Rotate corona slowly
        if (this.coronaMesh) {
            this.coronaMesh.rotation.y += deltaTime * 0.05;
        }
    }

    // Get light intensity (for UI display)
    getLightIntensity() {
        return this.pointLight ? this.pointLight.intensity : 0;
    }

    dispose() {
        super.dispose();

        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }

        if (this.coronaMesh) {
            this.coronaMesh.geometry.dispose();
            this.coronaMesh.material.dispose();
        }
    }
}

export default Sun;
