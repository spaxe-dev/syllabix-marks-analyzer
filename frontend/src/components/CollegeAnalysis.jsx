import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function CollegeAnalysis({ stats }) {
    const cardRef = useRef(null)

    useEffect(() => {
        if (!cardRef.current) return

        gsap.set(cardRef.current, { opacity: 0, y: 50 })

        const trigger = ScrollTrigger.create({
            trigger: cardRef.current,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })

                // Stagger inner cards
                const innerCards = cardRef.current.querySelectorAll('.college-card')
                gsap.set(innerCards, { opacity: 0, y: 30, scale: 0.96 })
                gsap.to(innerCards, {
                    opacity: 1, y: 0, scale: 1,
                    duration: 0.6, stagger: 0.12,
                    ease: 'power3.out', delay: 0.3,
                })

                // Animate progress bars
                setTimeout(() => {
                    const bars = cardRef.current.querySelectorAll('.progress-fill')
                    bars.forEach((bar) => {
                        const target = bar.dataset.width
                        gsap.fromTo(bar, { width: '0%' }, { width: `${target}%`, duration: 1.2, ease: 'power2.out' })
                    })
                }, 500)
            },
            once: true,
        })

        return () => trigger.kill()
    }, [stats])

    return (
        <div
            ref={cardRef}
            className="card"
            style={{ padding: '28px' }}
        >
            <p className="section-label">Comparison</p>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>
                College <span className="shimmer-text">Breakdown</span>
            </h3>

            <style>{`
        .college-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 1024px) { .college-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
            <div className="college-grid">
                {Object.entries(stats).map(([collegeName, collegeStat]) => {
                    const shortName = collegeName.split(':')[1]?.trim() || collegeName
                    const passRate = collegeStat.pass_percentage
                    const isGood = passRate >= 50

                    return (
                        <div
                            key={collegeName}
                            className="card-inner college-card"
                            style={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ minWidth: 0, flex: 1, paddingRight: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={shortName}>
                                        {shortName}
                                    </h4>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '4px' }}>
                                        {collegeStat.total_students} students
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p className="font-display" style={{
                                        fontSize: '28px', lineHeight: 1,
                                        color: isGood ? 'var(--color-positive)' : 'var(--color-negative)',
                                    }}>
                                        {passRate}%
                                    </p>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                                        pass rate
                                    </p>
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(248,113,113,0.15)', marginBottom: '24px' }}>
                                <div className="progress-fill" data-width={passRate} style={{
                                    height: '100%', borderRadius: '999px', background: 'var(--color-positive)', width: '0%',
                                }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.values(collegeStat.subject_stats).map((subj) => (
                                    <div key={subj.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', width: '120px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={subj.name}>
                                            {subj.name}
                                        </span>
                                        <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'var(--color-surface-3)' }}>
                                            <div className="progress-fill" data-width={subj.pass_percentage} style={{
                                                height: '100%', borderRadius: '999px',
                                                background: subj.pass_percentage < 50 ? 'var(--color-negative)' : 'var(--color-positive)',
                                                width: '0%',
                                            }} />
                                        </div>
                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', width: '36px', textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>
                                            {subj.pass_percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
