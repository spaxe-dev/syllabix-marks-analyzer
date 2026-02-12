import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function CachedResults({ results, onSelect }) {
    const sectionRef = useRef(null)
    const headingRef = useRef(null)

    useEffect(() => {
        if (!sectionRef.current) return

        const tl = gsap.timeline({ delay: 0.8 })
        const cards = sectionRef.current.querySelectorAll('.cached-card')
        const label = sectionRef.current.querySelector('.section-label')

        gsap.set(label, { opacity: 0, x: -20 })
        gsap.set(headingRef.current, { opacity: 0, y: 20 })
        gsap.set(cards, { opacity: 0, y: 30, scale: 0.95 })

        tl.to(label, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' })
            .to(headingRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
            .to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, '-=0.3')

        return () => tl.kill()
    }, [results])

    // Hover animation for cards
    const handleCardEnter = (e) => {
        gsap.to(e.currentTarget, { scale: 1.02, y: -4, duration: 0.3, ease: 'power2.out' })
        gsap.to(e.currentTarget.querySelector('.card-icon'), { rotate: 8, scale: 1.1, duration: 0.3, ease: 'back.out(2)' })
    }
    const handleCardLeave = (e) => {
        gsap.to(e.currentTarget, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' })
        gsap.to(e.currentTarget.querySelector('.card-icon'), { rotate: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
    }

    return (
        <section ref={sectionRef}>
            <p className="section-label" style={{ marginBottom: '4px' }}>Previous</p>
            <h2 ref={headingRef} style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Recent <span className="shimmer-text">Analyses</span>
            </h2>

            <style>{`
        .cached-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .cached-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .cached-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
            <div className="cached-grid">
                {results.map((item) => {
                    const date = new Date(item.timestamp * 1000).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                    })
                    return (
                        <button
                            key={item.hash}
                            onClick={() => onSelect(item.hash)}
                            onMouseEnter={handleCardEnter}
                            onMouseLeave={handleCardLeave}
                            className="card cached-card"
                            style={{
                                textAlign: 'left', padding: '20px', cursor: 'pointer',
                                display: 'flex', alignItems: 'flex-start', gap: '14px',
                                transformOrigin: 'center bottom',
                            }}
                        >
                            <div className="card-icon" style={{
                                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: '2px',
                            }}>
                                <span style={{ fontSize: '16px' }}>📄</span>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px', color: 'var(--color-text)' }}>
                                    {item.filename}
                                </p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                                    {item.student_count} students · {item.college_count} colleges
                                </p>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 500 }}>{date}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
