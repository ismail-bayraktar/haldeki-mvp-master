/**
 * Framer Motion-style variants for manual animation implementations
 */

export type Variant = 'initial' | 'animate' | 'exit'

export interface TransitionConfig {
  duration?: number
  delay?: number
  ease?: string | number[]
}

export const transitionDefaults: TransitionConfig = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const slideDownVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const slideLeftVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export const slideRightVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const scaleVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const pulseGlowVariants = {
  initial: { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
  animate: {
    boxShadow: [
      '0 0 0 0 hsl(var(--primary) / 0.4)',
      '0 0 0 10px hsl(var(--primary) / 0)',
    ],
  },
}

export const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, -5, -15, 0],
    transition: {
      duration: 6,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

export const shimmerVariants = {
  initial: { backgroundPosition: '-1000px 0' },
  animate: { backgroundPosition: '1000px 0' },
}

export const flipVariants = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  exit: { rotateY: 0 },
}

export const cardHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}
