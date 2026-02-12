import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Toppers({ toppers, metadata, onStudentClick }) {
    const cardRef = useRef(null)

    useEffect(() => {
        if (!cardRef.current) return
        const items = cardRef.current.querySelectorAll('.topper-row')

        gsap.set(cardRef.current, { opacity: 0, y: 50 })
        gsap.set(items, { opacity: 0, x: -30 })

        const trigger = ScrollTrigger.create({
            trigger: cardRef.current,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
                gsap.to(items, {
                    opacity: 1, x: 0,
                    duration: 0.5, stagger: 0.05,
                    ease: 'power3.out', delay: 0.3
                })
            },
            once: true,
        })

        return () => trigger.kill()
    }, [toppers])

    const handleRowEnter = (e) => {
        gsap.to(e.currentTarget, { x: 6, backgroundColor: 'var(--color-surface-2)', duration: 0.25, ease: 'power2.out' })
        gsap.to(e.currentTarget.querySelector('.topper-score'), { scale: 1.15, duration: 0.25, ease: 'back.out(2)' })
    }
    const handleRowLeave = (e) => {
        gsap.to(e.currentTarget, { x: 0, backgroundColor: 'transparent', duration: 0.3, ease: 'power2.out' })
        gsap.to(e.currentTarget.querySelector('.topper-score'), { scale: 1, duration: 0.25 })
    }

    return (
        <div
            ref={cardRef}
            className="card"
            style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}
        >
            <p className="section-label">Top Scores</p>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Subject <span className="shimmer-text">Toppers</span>
            </h3>

            <div style={{ flex: 1, maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {Object.entries(toppers).map(([code, topper], i) => {
                    const subjectName = metadata[code]?.name || code
                    return (
                        <div
                            key={code}
                            className="topper-row"
                            onClick={() => onStudentClick?.(topper.seat_no)}
                            onMouseEnter={handleRowEnter}
                            onMouseLeave={handleRowLeave}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            title={`Click to view ${topper.name}'s profile`}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: 'var(--color-accent-soft)', border: '1px solid rgba(212,168,67,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {subjectName}
                                    </p>
                                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#FAFAF9', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {topper.name}
                                    </p>
                                </div>
                            </div>
                            <div className="topper-score" style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                                <p className="font-display" style={{ fontSize: '20px', lineHeight: 1, color: 'var(--color-accent)' }}>{topper.marks}</p>
                                <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>#{topper.seat_no}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
