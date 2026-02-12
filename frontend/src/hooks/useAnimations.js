import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Animate a text element by splitting it into words that slide up
 */
export function useTextReveal(deps = []) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return

        const el = ref.current
        const text = el.textContent
        const words = text.split(' ')

        el.innerHTML = words
            .map((word) => `<span style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:4px"><span class="word-inner" style="display:inline-block;transform:translateY(110%)">${word}</span></span>`)
            .join(' ')

        const inners = el.querySelectorAll('.word-inner')
        gsap.to(inners, {
            y: 0,
            duration: 1,
            stagger: 0.06,
            ease: 'power4.out',
            delay: 0.2,
        })

        return () => { gsap.killTweensOf(inners) }
    }, deps)

    return ref
}

/**
 * Fade + slide up on scroll
 */
export function useScrollReveal(options = {}) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return
        const el = ref.current

        gsap.set(el, { opacity: 0, y: options.y ?? 40 })

        const trigger = ScrollTrigger.create({
            trigger: el,
            start: options.start ?? 'top 88%',
            onEnter: () => {
                gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: options.duration ?? 0.8,
                    ease: options.ease ?? 'power3.out',
                    delay: options.delay ?? 0,
                })
            },
            once: true,
        })

        return () => { trigger.kill(); gsap.killTweensOf(el) }
    }, [])

    return ref
}

/**
 * Stagger children on scroll
 */
export function useStaggerReveal(childSelector, options = {}) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return
        const children = ref.current.querySelectorAll(childSelector)
        if (!children.length) return

        gsap.set(children, { opacity: 0, y: options.y ?? 30 })

        const trigger = ScrollTrigger.create({
            trigger: ref.current,
            start: options.start ?? 'top 88%',
            onEnter: () => {
                gsap.to(children, {
                    opacity: 1,
                    y: 0,
                    duration: options.duration ?? 0.7,
                    stagger: options.stagger ?? 0.08,
                    ease: options.ease ?? 'power3.out',
                    delay: options.delay ?? 0,
                })
            },
            once: true,
        })

        return () => { trigger.kill(); gsap.killTweensOf(children) }
    }, [])

    return ref
}

/**
 * Animate a number counting up
 */
export function useCountUp(endValue, options = {}) {
    const ref = useRef(null)
    const numRef = useRef({ val: 0 })

    useEffect(() => {
        if (!ref.current || endValue == null) return
        const isPercent = typeof endValue === 'string' && endValue.includes('%')
        const numericVal = parseFloat(endValue)
        if (isNaN(numericVal)) {
            ref.current.textContent = endValue
            return
        }

        const hasDecimal = String(endValue).includes('.')
        numRef.current.val = 0

        const trigger = ScrollTrigger.create({
            trigger: ref.current,
            start: 'top 90%',
            onEnter: () => {
                gsap.to(numRef.current, {
                    val: numericVal,
                    duration: options.duration ?? 1.8,
                    ease: options.ease ?? 'power2.out',
                    delay: options.delay ?? 0,
                    onUpdate: () => {
                        if (!ref.current) return
                        const v = hasDecimal ? numRef.current.val.toFixed(2) : Math.round(numRef.current.val)
                        ref.current.textContent = isPercent ? `${v}%` : v
                    },
                })
            },
            once: true,
        })

        return () => { trigger.kill(); gsap.killTweensOf(numRef.current) }
    }, [endValue])

    return ref
}

/**
 * Magnetic hover effect
 */
export function useMagnetic(strength = 0.3) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return
        const el = ref.current

        const onMove = (e) => {
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left - rect.width / 2
            const y = e.clientY - rect.top - rect.height / 2
            gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power2.out' })
        }
        const onLeave = () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
        }

        el.addEventListener('mousemove', onMove)
        el.addEventListener('mouseleave', onLeave)
        return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
    }, [strength])

    return ref
}
