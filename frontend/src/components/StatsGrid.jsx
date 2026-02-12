import { useRef, useEffect, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function CgpaHistogram({ students }) {
    const barsRef = useRef(null)

    // Compute CGPA distribution in 10 buckets: 0-1, 1-2, ..., 9-10
    const buckets = useMemo(() => {
        const bins = new Array(10).fill(0)
        students.forEach((s) => {
            if (s.cgpa != null && s.cgpa > 0) {
                const idx = Math.min(Math.floor(s.cgpa), 9)
                bins[idx]++
            }
        })
        return bins
    }, [students])

    const max = Math.max(...buckets, 1)

    useEffect(() => {
        if (!barsRef.current) return
        const bars = barsRef.current.querySelectorAll('.histo-bar')
        gsap.fromTo(bars,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.8, stagger: 0.05, ease: 'back.out(1.7)', delay: 1.5 }
        )
    }, [buckets])

    return (
        <div ref={barsRef} style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '32px', marginTop: '14px' }}>
            {buckets.map((count, i) => {
                const pct = (count / max) * 100
                const isHighlight = i >= 7 // 7-10 CGPA range highlighted
                return (
                    <div
                        key={i}
                        className="histo-bar"
                        title={`${i}–${i + 1} CGPA: ${count} students`}
                        style={{
                            flex: 1,
                            height: `${Math.max(pct, 6)}%`,
                            borderRadius: '2px 2px 0 0',
                            background: isHighlight ? 'var(--color-accent)' : 'var(--color-surface-3)',
                            transformOrigin: 'bottom',
                            transition: 'background 0.2s',
                            cursor: 'default',
                        }}
                    />
                )
            })}
        </div>
    )
}

export default function StatsGrid({ stats, students }) {
    const gridRef = useRef(null)

    const items = [
        { label: 'Total Students', value: stats.total_students, icon: '👥' },
        { label: 'Passed', value: stats.passed_students, icon: '✓', color: 'var(--color-positive)' },
        { label: 'Pass Rate', value: `${stats.pass_percentage}%`, icon: '◉', highlight: true },
        { label: 'Median CGPA', value: stats.median_cgpa?.toFixed(2) || '—', icon: '◈', histogram: true },
    ]

    useEffect(() => {
        if (!gridRef.current) return
        const cards = gridRef.current.querySelectorAll('.stat-card')
        const values = gridRef.current.querySelectorAll('.stat-value')

        gsap.set(cards, { opacity: 0, y: 40, scale: 0.92 })

        const trigger = ScrollTrigger.create({
            trigger: gridRef.current,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(cards, {
                    opacity: 1, y: 0, scale: 1,
                    duration: 0.8, stagger: 0.1,
                    ease: 'back.out(1.4)',
                })

                values.forEach((el) => {
                    const raw = el.dataset.value
                    const isPercent = raw.includes('%')
                    const hasDecimal = raw.includes('.')
                    const numericVal = parseFloat(raw)

                    if (isNaN(numericVal)) {
                        el.textContent = raw
                        return
                    }

                    const counter = { val: 0 }
                    gsap.to(counter, {
                        val: numericVal,
                        duration: 2,
                        delay: 0.3,
                        ease: 'power2.out',
                        onUpdate: () => {
                            const v = hasDecimal ? counter.val.toFixed(2) : Math.round(counter.val)
                            el.textContent = isPercent ? `${v}%` : v
                        },
                    })
                })
            },
            once: true,
        })

        return () => { trigger.kill() }
    }, [stats])

    return (
        <>
            <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
            <div className="stats-grid" ref={gridRef}>
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="card stat-card"
                        style={{
                            padding: '24px',
                            ...(item.highlight ? { borderColor: 'rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)' } : {}),
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>{item.icon}</span>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                {item.label}
                            </p>
                        </div>
                        <p
                            className="font-display stat-value"
                            data-value={String(item.value)}
                            style={{
                                fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                                lineHeight: 1,
                                color: item.highlight ? 'var(--color-accent)' : (item.color || 'inherit'),
                            }}
                        >
                            0
                        </p>
                        {item.histogram && students && <CgpaHistogram students={students} />}
                    </div>
                ))}
            </div>
        </>
    )
}
