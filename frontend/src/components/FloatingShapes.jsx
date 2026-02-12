import { useRef, useEffect } from 'react'
import gsap from 'gsap'

const shapes = [
    // Large accent rectangle
    { type: 'rect', w: 120, h: 50, color: '#D4A843', radius: 12, rotation: -12, x: '75%', y: '12%', opacity: 0.15 },
    // Small green circle
    { type: 'circle', size: 18, color: '#4ADE80', x: '82%', y: '8%', opacity: 0.5 },
    // Pink pill
    { type: 'rect', w: 80, h: 32, color: '#C084FC', radius: 16, rotation: 8, x: '88%', y: '32%', opacity: 0.12 },
    // Gold star/asterisk
    { type: 'asterisk', size: 36, color: '#D4A843', x: '65%', y: '42%', opacity: 0.18 },
    // Small blue dot
    { type: 'circle', size: 10, color: '#60A5FA', x: '12%', y: '22%', opacity: 0.35 },
    // Dashed line
    { type: 'line', length: 140, color: '#71717A', x: '85%', y: '18%', rotation: 35, opacity: 0.25 },
    // Medium warm rect
    { type: 'rect', w: 60, h: 60, color: '#D4A843', radius: 14, rotation: 45, x: '8%', y: '55%', opacity: 0.06 },
    // Tiny accent circle
    { type: 'circle', size: 8, color: '#FBBF24', x: '35%', y: '75%', opacity: 0.3 },
    // Large faded circle
    { type: 'circle', size: 90, color: '#818CF8', x: '92%', y: '65%', opacity: 0.04 },
    // Cross
    { type: 'cross', size: 24, color: '#A78BFA', x: '18%', y: '78%', opacity: 0.2 },
    // Another dashed line
    { type: 'line', length: 100, color: '#71717A', x: '25%', y: '38%', rotation: -20, opacity: 0.15 },
    // Small green square
    { type: 'rect', w: 14, h: 14, color: '#4ADE80', radius: 3, rotation: 0, x: '92%', y: '48%', opacity: 0.4 },
    // Floating ring
    { type: 'ring', size: 44, color: '#D4A843', x: '48%', y: '85%', opacity: 0.1 },
    // Tiny pink dot
    { type: 'circle', size: 6, color: '#F472B6', x: '72%', y: '72%', opacity: 0.4 },
    // Large subtle rect
    { type: 'rect', w: 180, h: 70, color: '#D4A843', radius: 18, rotation: -6, x: '55%', y: '18%', opacity: 0.03 },
]

function ShapeSVG({ shape }) {
    switch (shape.type) {
        case 'circle':
            return (
                <svg width={shape.size} height={shape.size} viewBox={`0 0 ${shape.size} ${shape.size}`}>
                    <circle cx={shape.size / 2} cy={shape.size / 2} r={shape.size / 2} fill={shape.color} />
                </svg>
            )
        case 'rect':
            return (
                <svg width={shape.w} height={shape.h} viewBox={`0 0 ${shape.w} ${shape.h}`}>
                    <rect width={shape.w} height={shape.h} rx={shape.radius} fill={shape.color} />
                </svg>
            )
        case 'asterisk':
            const s = shape.size
            return (
                <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                    {[0, 45, 90, 135].map((angle) => (
                        <line
                            key={angle}
                            x1={s / 2} y1={2} x2={s / 2} y2={s - 2}
                            stroke={shape.color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            transform={`rotate(${angle} ${s / 2} ${s / 2})`}
                        />
                    ))}
                </svg>
            )
        case 'cross':
            const c = shape.size
            return (
                <svg width={c} height={c} viewBox={`0 0 ${c} ${c}`}>
                    <line x1={c / 2} y1={2} x2={c / 2} y2={c - 2} stroke={shape.color} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={2} y1={c / 2} x2={c - 2} y2={c / 2} stroke={shape.color} strokeWidth={2.5} strokeLinecap="round" />
                </svg>
            )
        case 'line':
            return (
                <svg width={shape.length} height={4} viewBox={`0 0 ${shape.length} 4`}>
                    <line x1={0} y1={2} x2={shape.length} y2={2} stroke={shape.color} strokeWidth={2} strokeDasharray="8 6" strokeLinecap="round" />
                </svg>
            )
        case 'ring':
            return (
                <svg width={shape.size} height={shape.size} viewBox={`0 0 ${shape.size} ${shape.size}`}>
                    <circle cx={shape.size / 2} cy={shape.size / 2} r={shape.size / 2 - 3} fill="none" stroke={shape.color} strokeWidth={2.5} />
                </svg>
            )
        default:
            return null
    }
}

export default function FloatingShapes() {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return
        const els = containerRef.current.querySelectorAll('.floating-shape')

        els.forEach((el, i) => {
            const shape = shapes[i]
            if (!shape) return

            // Continuous floating animation — each shape has unique timing
            const duration = 4 + Math.random() * 6
            const yRange = 15 + Math.random() * 25
            const xRange = 8 + Math.random() * 15
            const rotRange = 10 + Math.random() * 20

            // Initial entrance — scatter in
            gsap.fromTo(el,
                { opacity: 0, scale: 0, rotation: (shape.rotation || 0) - 30 },
                {
                    opacity: shape.opacity,
                    scale: 1,
                    rotation: shape.rotation || 0,
                    duration: 1.2 + Math.random() * 0.8,
                    delay: 0.1 + i * 0.08,
                    ease: 'back.out(1.5)',
                }
            )

            // Continuous float
            gsap.to(el, {
                y: `+=${yRange}`,
                x: `+=${xRange}`,
                rotation: `+=${rotRange}`,
                duration,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: Math.random() * 2,
            })
        })

        return () => {
            els.forEach((el) => gsap.killTweensOf(el))
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1,
                overflow: 'hidden',
            }}
        >
            {shapes.map((shape, i) => (
                <div
                    key={i}
                    className="floating-shape"
                    style={{
                        position: 'absolute',
                        left: shape.x,
                        top: shape.y,
                        opacity: 0,
                        transform: `rotate(${shape.rotation || 0}deg)`,
                        willChange: 'transform, opacity',
                        filter: 'blur(0.5px)',
                    }}
                >
                    <ShapeSVG shape={shape} />
                </div>
            ))}
        </div>
    )
}
