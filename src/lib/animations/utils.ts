/**
 * Animation utility functions for performant, GPU-accelerated animations
 */

export type AnimationConfig = {
  duration?: number;
  delay?: number;
  easing?: string;
}

export const createAnimation = (config: AnimationConfig = {}): string => {
  const { duration = 300, delay = 0, easing = 'ease-out' } = config
  return `${duration}ms ${easing} ${delay}ms`
}

export const easingFunctions = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

export const springConfigs = {
  gentle: { tension: 280, friction: 40 },
  bouncy: { tension: 300, friction: 10 },
  stiff: { tension: 400, friction: 50 },
  slow: { tension: 200, friction: 60 },
}

export const animationDurations = {
  instant: 100,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
}

export const gpuAcceleratedProps = [
  'transform',
  'opacity',
  'filter',
] as const

export function isGPUAccelerated(prop: string): prop is typeof gpuAcceleratedProps[number] {
  return gpuAcceleratedProps.includes(prop as any)
}
