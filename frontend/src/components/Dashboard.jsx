import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import StatsGrid from './StatsGrid'
import GradeChart from './GradeChart'
import Toppers from './Toppers'
import CollegeAnalysis from './CollegeAnalysis'
import StudentSearch from './StudentSearch'
import StudentsTable from './StudentsTable'

gsap.registerPlugin(ScrollTrigger)

export default function Dashboard({ data, fileName, onReset }) {
    const [lookupSeatNo, setLookupSeatNo] = useState(null)
    const searchRef = useRef(null)
    const containerRef = useRef(null)
    const headerRef = useRef(null)

    const handleStudentClick = (seatNo) => {
        setLookupSeatNo(seatNo)
        setTimeout(() => {
            searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    // Dashboard entrance — grand reveal
    useEffect(() => {
        if (!containerRef.current) return
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Header card sweeps in
        if (headerRef.current) {
            gsap.set(headerRef.current, { opacity: 0, x: -60, scale: 0.96 })
            tl.to(headerRef.current, { opacity: 1, x: 0, scale: 1, duration: 0.9 }, 0)
        }

        return () => tl.kill()
    }, [])

    return (
        <div ref={containerRef}>
            <style>{`
        .two-col { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1024px) { .two-col { grid-template-columns: 1fr 1fr; } }
      `}</style>

            {/* File header bar */}
            <div ref={headerRef} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, #D4A843 0%, #B8912E 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 2px 12px rgba(212,168,67,0.2)',
                        fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800,
                        color: '#09090B'
                    }}>
                        S
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</h2>
                        <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--color-text-muted)' }}>
                            {data.students.length} students · {Object.keys(data.course_metadata).length} subjects
                        </p>
                    </div>
                </div>
                <button
                    onClick={onReset}
                    style={{
                        fontSize: '13px', fontWeight: 600, padding: '8px 18px',
                        borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)', flexShrink: 0, marginLeft: '16px',
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                        color: 'var(--color-text-secondary)',
                    }}
                    onMouseOver={(e) => { e.target.style.color = 'var(--color-accent)'; e.target.style.borderColor = 'rgba(212,168,67,0.3)' }}
                    onMouseOut={(e) => { e.target.style.color = 'var(--color-text-secondary)'; e.target.style.borderColor = 'var(--color-border)' }}
                >
                    ← Back
                </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <StatsGrid stats={data.statistics} students={data.students} />
            </div>

            <div className="two-col" style={{ marginBottom: '24px' }}>
                <Toppers toppers={data.statistics.subject_toppers} metadata={data.course_metadata} onStudentClick={handleStudentClick} />
                <GradeChart students={data.students} />
            </div>

            {data.statistics.college_statistics && Object.keys(data.statistics.college_statistics).length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <CollegeAnalysis stats={data.statistics.college_statistics} />
                </div>
            )}

            <div style={{ marginBottom: '24px' }} ref={searchRef}>
                <StudentSearch students={data.students} externalSeatNo={lookupSeatNo} onExternalConsumed={() => setLookupSeatNo(null)} />
            </div>

            <StudentsTable students={data.students} onStudentClick={handleStudentClick} />
        </div>
    )
}
