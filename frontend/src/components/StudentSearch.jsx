import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function StudentSearch({ students, externalSeatNo, onExternalConsumed }) {
    const [seatNo, setSeatNo] = useState('')
    const [result, setResult] = useState(null)
    const cardRef = useRef(null)
    const resultRef = useRef(null)

    // Scroll-triggered entrance
    useEffect(() => {
        if (!cardRef.current) return
        gsap.set(cardRef.current, { opacity: 0, y: 50 })

        const trigger = ScrollTrigger.create({
            trigger: cardRef.current,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
            },
            once: true,
        })

        return () => trigger.kill()
    }, [])

    // External seat number
    useEffect(() => {
        if (externalSeatNo) {
            setSeatNo(externalSeatNo)
            runAnalysis(externalSeatNo)
            onExternalConsumed?.()
        }
    }, [externalSeatNo])

    // Animate result card in
    useEffect(() => {
        if (!resultRef.current || !result) return
        gsap.fromTo(resultRef.current,
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }
        )

        // Animate table rows if present
        const rows = resultRef.current.querySelectorAll('tbody tr')
        if (rows.length) {
            gsap.fromTo(rows,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.4, stagger: 0.03, ease: 'power3.out', delay: 0.3 }
            )
        }

        // Animate stats
        const statValues = resultRef.current.querySelectorAll('.stat-num')
        statValues.forEach((el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.2 }
            )
        })
    }, [result])

    const gradeColors = {
        O: { bg: '#22c55e22', color: '#FAFAF9' },
        'A+': { bg: '#3b82f622', color: '#FAFAF9' },
        A: { bg: '#6366f122', color: '#FAFAF9' },
        'B+': { bg: '#a855f722', color: '#FAFAF9' },
        B: { bg: '#8b5cf622', color: '#FAFAF9' },
        C: { bg: '#f59e0b22', color: '#FAFAF9' },
        D: { bg: '#f9731622', color: '#FAFAF9' },
        F: { bg: '#ef444422', color: '#FAFAF9' },
    }

    const runAnalysis = (query) => {
        const q = (query || seatNo).trim()
        if (!q) return

        const student = students.find((s) => s.seat_no === q)
        if (!student) {
            setResult({ error: true, message: `No student found for seat #${q}` })
            return
        }

        const rank = students.filter((s) => s.total_marks > student.total_marks).length + 1
        const percentile = (
            (students.filter((s) => s.total_marks < student.total_marks).length / students.length) * 100
        ).toFixed(1)

        const subjectComparison = student.subjects
            .map((sub, i) => {
                if (!sub.total) return null
                const marks = students.filter((s) => s.subjects[i]?.total).map((s) => s.subjects[i].total)
                if (!marks.length) return null
                return {
                    ...sub,
                    avg: (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1),
                    max: Math.max(...marks),
                    rank: marks.filter((m) => m > sub.total).length + 1,
                    total_students: marks.length,
                }
            })
            .filter(Boolean)

        setResult({ error: false, student, rank, percentile, subjects: subjectComparison })
    }

    return (
        <div
            ref={cardRef}
            className="card"
            style={{ padding: '28px' }}
        >
            <p className="section-label">Individual</p>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Student <span className="shimmer-text">Lookup</span>
            </h3>

            {/* Search */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                    type="text"
                    value={seatNo}
                    onChange={(e) => setSeatNo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
                    placeholder="Enter seat number"
                    maxLength={7}
                    style={{
                        flex: 1, padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', outline: 'none',
                        transition: 'border-color 0.2s', fontFamily: 'var(--font-body)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(212,168,67,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                    onClick={() => runAnalysis()}
                    style={{
                        padding: '12px 24px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-accent)', color: 'var(--color-bg)',
                        fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                        transition: 'background 0.2s, transform 0.15s', fontFamily: 'var(--font-body)',
                    }}
                    onMouseDown={(e) => gsap.to(e.target, { scale: 0.95, duration: 0.1 })}
                    onMouseUp={(e) => gsap.to(e.target, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })}
                    onMouseOver={(e) => e.target.style.background = 'var(--color-accent-hover)'}
                    onMouseOut={(e) => { e.target.style.background = 'var(--color-accent)'; gsap.to(e.target, { scale: 1, duration: 0.2 }) }}
                >
                    Analyze
                </button>
            </div>

            {/* Result */}
            {result && (
                <div ref={resultRef}>
                    {result.error ? (
                        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-negative-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>
                            <p style={{ color: 'var(--color-negative)', fontSize: '14px', fontWeight: 600 }}>{result.message}</p>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

                            {/* Student identity */}
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '52px', height: '52px', borderRadius: '50%',
                                            background: 'var(--color-accent)', color: 'var(--color-bg)',
                                            fontWeight: 800, fontSize: '20px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            fontFamily: 'var(--font-body)',
                                        }}>
                                            {result.student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.01em' }}>{result.student.name}</h4>
                                            <p style={{ fontSize: '13px', marginTop: '3px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                                #{result.student.seat_no} · {result.student.gender}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '12px', fontWeight: 800, padding: '6px 16px', borderRadius: '999px',
                                        background: result.student.result === 'PASS' ? 'var(--color-positive-soft)' : 'var(--color-negative-soft)',
                                        color: result.student.result === 'PASS' ? 'var(--color-positive)' : 'var(--color-negative)',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {result.student.result === 'PASS' ? 'PASSED' : 'FAILED'}
                                    </span>
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                                {[
                                    { label: 'Rank', value: `#${result.rank}`, accent: true },
                                    { label: 'Percentile', value: `${result.percentile}%` },
                                    { label: 'Total', value: result.student.total_marks },
                                    { label: 'CGPA', value: result.student.cgpa?.toFixed(2) || '—' },
                                ].map((s, i) => (
                                    <div key={s.label} style={{
                                        padding: '18px 16px', textAlign: 'center',
                                        borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none',
                                    }}>
                                        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>{s.label}</p>
                                        <p className="font-display stat-num" style={{ fontSize: '22px', color: s.accent ? 'var(--color-accent)' : 'var(--color-text)' }}>
                                            {s.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Subject table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                                            {['Subject', 'T1', 'O1', 'E1', 'I1', 'Total', 'Grade', 'Rank'].map((h) => (
                                                <th key={h} style={{
                                                    padding: '14px 18px', textAlign: 'left', fontSize: '11px',
                                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    color: 'var(--color-text-muted)', fontWeight: 700,
                                                }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.subjects.map((s, idx) => (
                                            <tr key={s.code} style={{
                                                borderBottom: '1px solid var(--color-border)',
                                                background: s.passed === false ? 'rgba(248,113,113,0.06)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'),
                                                transition: 'background 0.12s',
                                            }}
                                                onMouseOver={(e) => { if (s.passed !== false) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                                                onMouseOut={(e) => { if (s.passed !== false) e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                                            >
                                                <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }} title={s.name}>
                                                    {s.name.length > 26 ? s.name.substring(0, 24) + '…' : s.name}
                                                </td>
                                                <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.term_work ?? '—'}</td>
                                                <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.oral ?? '—'}</td>
                                                <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.external ?? '—'}</td>
                                                <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.internal ?? '—'}</td>
                                                <td style={{ padding: '14px 18px', fontSize: '15px', fontWeight: 800, color: 'var(--color-text)' }}>{s.total}</td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <span style={{
                                                        fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px',
                                                        fontFamily: 'var(--font-body)',
                                                        background: gradeColors[s.grade]?.bg || 'transparent',
                                                        color: gradeColors[s.grade]?.color || '#FAFAF9',
                                                    }}>
                                                        {s.grade}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                                    #{s.rank}/{s.total_students}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
