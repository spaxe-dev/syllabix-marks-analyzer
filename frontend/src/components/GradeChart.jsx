import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)
gsap.registerPlugin(ScrollTrigger)

export default function GradeChart({ students }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    const cardRef = useRef(null)

    useEffect(() => {
        if (!canvasRef.current) return

        const gradeCounts = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 }
        students.forEach((s) => {
            s.subjects.forEach((sub) => {
                if (sub.grade && gradeCounts.hasOwnProperty(sub.grade)) gradeCounts[sub.grade]++
            })
        })

        if (chartRef.current) chartRef.current.destroy()

        // Scroll-triggered card entrance
        gsap.set(cardRef.current, { opacity: 0, y: 50 })
        const trigger = ScrollTrigger.create({
            trigger: cardRef.current,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(cardRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })

                // Create chart after card is visible (delayed for drama)
                setTimeout(() => {
                    chartRef.current = new Chart(canvasRef.current, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(gradeCounts),
                            datasets: [{
                                data: Object.values(gradeCounts),
                                backgroundColor: [
                                    '#4ADE80', '#60A5FA', '#818CF8', '#A78BFA',
                                    '#C084FC', '#FBBF24', '#FB923C', '#F87171',
                                ],
                                borderWidth: 3,
                                borderColor: '#141417',
                                hoverOffset: 8,
                            }],
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '66%',
                            animation: {
                                animateRotate: true,
                                animateScale: true,
                                duration: 1500,
                                easing: 'easeOutQuart',
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#A1A1AA',
                                        font: { family: "'Figtree', sans-serif", size: 11, weight: 500 },
                                        padding: 16,
                                        usePointStyle: true,
                                        pointStyle: 'circle',
                                        pointStyleWidth: 8,
                                    },
                                },
                                tooltip: {
                                    backgroundColor: '#1C1C21',
                                    titleColor: '#FAFAF9',
                                    bodyColor: '#A1A1AA',
                                    titleFont: { family: "'Instrument Serif', serif", size: 14 },
                                    bodyFont: { family: "'Figtree', sans-serif", size: 12 },
                                    borderColor: '#27272A',
                                    borderWidth: 1,
                                    padding: 12,
                                    cornerRadius: 10,
                                    displayColors: true,
                                    boxPadding: 4,
                                },
                            },
                        },
                    })
                }, 300)
            },
            once: true,
        })

        return () => { if (chartRef.current) chartRef.current.destroy(); trigger.kill() }
    }, [students])

    return (
        <div
            ref={cardRef}
            className="card"
            style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}
        >
            <p className="section-label">Overview</p>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Grade <span className="shimmer-text">Distribution</span>
            </h3>
            <div style={{ flex: 1, minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    )
}
