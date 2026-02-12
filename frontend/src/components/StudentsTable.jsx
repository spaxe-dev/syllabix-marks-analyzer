import { useState, useMemo, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function StudentsTable({ students, onStudentClick }) {
    const [filterText, setFilterText] = useState('')
    const [resultFilter, setResultFilter] = useState('all')
    const cardRef = useRef(null)
    const tableRef = useRef(null)

    const sorted = useMemo(
        () => [...students].sort((a, b) => b.total_marks - a.total_marks),
        [students]
    )

    const filtered = useMemo(() => {
        return sorted.filter((s) => {
            const matchText = !filterText || s.seat_no.includes(filterText) || s.name.toLowerCase().includes(filterText.toLowerCase())
            const matchResult = resultFilter === 'all' || (resultFilter === 'pass' && s.result === 'PASS') || (resultFilter === 'fail' && s.result !== 'PASS')
            return matchText && matchResult
        })
    }, [sorted, filterText, resultFilter])

    // Scroll-triggered entrance
    useEffect(() => {
        if (!cardRef.current) return
        gsap.set(cardRef.current, { opacity: 0, y: 60 })

        const trigger = ScrollTrigger.create({
            trigger: cardRef.current,
            start: 'top 90%',
            onEnter: () => {
                gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })

                // Stagger first visible rows
                setTimeout(() => {
                    if (!tableRef.current) return
                    const rows = tableRef.current.querySelectorAll('tbody tr')
                    const visible = Array.from(rows).slice(0, 12)
                    gsap.fromTo(visible,
                        { opacity: 0, x: -20 },
                        { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }
                    )
                }, 300)
            },
            once: true,
        })

        return () => trigger.kill()
    }, [])

    // Row click animation
    const handleRowClick = (e, seatNo) => {
        const row = e.currentTarget
        gsap.to(row, {
            backgroundColor: 'rgba(212,168,67,0.08)',
            scale: 0.99,
            duration: 0.15,
            onComplete: () => {
                gsap.to(row, { backgroundColor: 'transparent', scale: 1, duration: 0.3 })
                onStudentClick?.(seatNo)
            }
        })
    }

    return (
        <div
            ref={cardRef}
            className="card"
            style={{ overflow: 'hidden' }}
        >
            {/* Header + filters */}
            <div style={{
                padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '16px',
            }}>
                <div>
                    <p className="section-label">Full List</p>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700 }}>
                        All <span className="shimmer-text">Students</span>
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Search name or seat no."
                        style={{
                            padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500,
                            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                            color: 'var(--color-text)', outline: 'none', width: '220px',
                            transition: 'border-color 0.2s', fontFamily: 'var(--font-body)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(212,168,67,0.5)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                    <select
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value)}
                        style={{
                            padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500,
                            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                            color: 'var(--color-text)', outline: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        <option value="all">All</option>
                        <option value="pass">Passed</option>
                        <option value="fail">Failed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div ref={tableRef} style={{ overflowX: 'auto', maxHeight: '560px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                            {['Rank', 'Seat No', 'Name', 'College', 'Total', 'Result'].map((h) => (
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
                        {filtered.map((student, idx) => {
                            const globalRank = sorted.indexOf(student) + 1
                            const collegeName = student.college?.split(':')?.[1]?.trim()?.split(' ').slice(0, 4).join(' ') || '—'
                            return (
                                <tr
                                    key={student.seat_no}
                                    onClick={(e) => handleRowClick(e, student.seat_no)}
                                    style={{
                                        borderBottom: '1px solid var(--color-border)',
                                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                        cursor: 'pointer', transition: 'background 0.12s',
                                        transformOrigin: 'center center',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(212,168,67,0.04)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                                    title={`Click to view ${student.name}'s profile`}
                                >
                                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        {String(globalRank).padStart(3, '0')}
                                    </td>
                                    <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{student.seat_no}</td>
                                    <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{student.name}</td>
                                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={collegeName}>
                                        {collegeName}
                                    </td>
                                    <td style={{ padding: '14px 18px', fontSize: '15px', fontWeight: 800 }}>{student.total_marks}</td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 800, padding: '5px 14px', borderRadius: '999px',
                                            letterSpacing: '0.04em',
                                            background: student.result === 'PASS' ? 'var(--color-positive-soft)' : 'var(--color-negative-soft)',
                                            color: student.result === 'PASS' ? 'var(--color-positive)' : 'var(--color-negative)',
                                        }}>
                                            {student.result}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 500 }}>
                    {filtered.length} of {students.length} students
                </span>
            </div>
        </div>
    )
}
