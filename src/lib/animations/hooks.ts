import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook to detect user's reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to add GPU acceleration hints to an element
 */
export function useGPUAcceleration() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.style.willChange = 'transform, opacity'
    element.style.transform = 'translateZ(0)'
    element.style.backfaceVisibility = 'hidden' as any
    element.style.perspective = '1000px'

    return () => {
      element.style.willChange = ''
    }
  }, [])

  return ref
}

/**
 * Optimized animation frame hook with cleanup
 */
export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  enabled: boolean = true
) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    },
    [callback]
  )

  useEffect(() => {
    if (!enabled) return

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [enabled, animate])
}

/**
 * Hook to animate a value from start to end over duration
 */
export function useAnimatedValue(
  end: number,
  duration: number = 300,
  easing: (t: number) => number = (t) => t
) {
  const [value, setValue] = useState(end)
  const startTimeRef = useRef<number>()
  const startValueRef = useRef(end)

  useEffect(() => {
    startValueRef.current = value
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || 0)
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)

      setValue(startValueRef.current + (end - startValueRef.current) * easedProgress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration, easing])

  return value
}

/**
 * Hook for staggered children animations
 */
export function useStagger(index: number, staggerDelay: number = 50) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(true), index * staggerDelay)
    return () => clearTimeout(timer)
  }, [index, staggerDelay])

  return shouldAnimate
}
