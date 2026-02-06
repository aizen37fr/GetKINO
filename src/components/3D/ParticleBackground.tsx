/**
 * ParticleBackground Component
 * Creates an animated particle system background with customizable themes
 */

import { useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

interface ParticleBackgroundProps {
    theme?: 'default' | 'anime' | 'kdrama' | 'scifi' | 'horror';
}

export function ParticleBackground({ theme = 'default' }: ParticleBackgroundProps) {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    const particlesConfig = useMemo(() => {
        const baseConfig = {
            fullScreen: {
                enable: true,
                zIndex: -1
            },
            background: {
                color: {
                    value: 'transparent'
                }
            },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onClick: {
                        enable: true,
                        mode: 'push'
                    },
                    onHover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    resize: true
                },
                modes: {
                    push: {
                        quantity: 4
                    },
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    }
                }
            },
            particles: {
                color: {
                    value: '#00f5ff'
                },
                links: {
                    color: '#00f5ff',
                    distance: 150,
                    enable: false,
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    direction: 'none' as const,
                    enable: true,
                    outModes: {
                        default: 'out' as const
                    },
                    random: true,
                    speed: 1,
                    straight: false
                },
                number: {
                    density: {
                        enable: true,
                        area: 800
                    },
                    value: 80
                },
                opacity: {
                    value: 0.5,
                    random: true,
                    animation: {
                        enable: true,
                        speed: 1,
                        minimumValue: 0.1
                    }
                },
                shape: {
                    type: 'circle'
                },
                size: {
                    value: { min: 1, max: 3 },
                    random: true,
                    animation: {
                        enable: true,
                        speed: 2,
                        minimumValue: 0.5
                    }
                }
            },
            detectRetina: true
        };

        // Customize based on theme
        switch (theme) {
            case 'anime':
                return {
                    ...baseConfig,
                    particles: {
                        ...baseConfig.particles,
                        color: { value: ['#ff69b4', '#ffc0cb', '#ffb6c1'] },
                        shape: { type: 'image', image: [{ src: 'data:image/svg+xml;base64,...', width: 20, height: 20 }] }, // sakura petal
                        move: { ...baseConfig.particles.move, direction: 'bottom' as const, speed: 0.5 },
                        number: { ...baseConfig.particles.number, value: 50 }
                    }
                };

            case 'kdrama':
                return {
                    ...baseConfig,
                    particles: {
                        ...baseConfig.particles,
                        color: { value: ['#ff1744', '#f50057', '#ff4081'] },
                        number: { ...baseConfig.particles.number, value: 60 }
                    }
                };

            case 'scifi':
                return {
                    ...baseConfig,
                    particles: {
                        ...baseConfig.particles,
                        color: { value: ['#00f5ff', '#00d9ff', '#00b8d4'] },
                        links: { ...baseConfig.particles.links, enable: true },
                        number: { ...baseConfig.particles.number, value: 100 }
                    }
                };

            case 'horror':
                return {
                    ...baseConfig,
                    particles: {
                        ...baseConfig.particles,
                        color: { value: ['#7f1d1d', '#991b1b', '#b91c1c'] },
                        opacity: { ...baseConfig.particles.opacity, value: 0.3 },
                        move: { ...baseConfig.particles.move, speed: 0.3 },
                        number: { ...baseConfig.particles.number, value: 40 }
                    }
                };

            default:
                return baseConfig;
        }
    }, [theme]);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesConfig}
        />
    );
}
