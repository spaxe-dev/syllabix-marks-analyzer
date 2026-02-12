import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function Upload({ onFileProcessed }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef(null)
    const cardRef = useRef(null)
    const iconRef = useRef(null)
    const textRef = useRef(null)
    const subRef = useRef(null)

    // Entrance animation
    useEffect(() => {
        if (!cardRef.current) return
        const tl = gsap.timeline({ delay: 0.3 })
        gsap.set(cardRef.current, { opacity: 0, y: 50, scale: 0.97 })
        gsap.set(iconRef.current, { opacity: 0, y: 30, scale: 0.5, rotate: -15 })
        gsap.set(textRef.current, { opacity: 0, y: 20 })
        gsap.set(subRef.current, { opacity: 0, y: 10 })

        tl.to(cardRef.current, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' })
            .to(iconRef.current, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2)' }, '-=0.5')
            .to(textRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
            .to(subRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')

        return () => tl.kill()
    }, [])

    // Magnetic hover on card
    useEffect(() => {
        if (!cardRef.current) return
        const el = cardRef.current

        const onMove = (e) => {
            const rect = el.getBoundingClientRect()
            const x = (e.clientX - rect.left - rect.width / 2) * 0.03
            const y = (e.clientY - rect.top - rect.height / 2) * 0.03
            gsap.to(el, { x, y, rotateX: -y * 2, rotateY: x * 2, duration: 0.4, ease: 'power2.out' })
        }
        const onLeave = () => {
            gsap.to(el, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
        }

        el.addEventListener('mousemove', onMove)
        el.addEventListener('mouseleave', onLeave)
        return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
    }, [])

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file?.type === 'application/pdf') processFile(file)
    }

    const processFile = async (file) => {
        setIsProcessing(true)

        // Processing entrance animation
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                borderColor: 'var(--color-accent)',
                boxShadow: '0 0 80px rgba(212,168,67,0.1)',
                duration: 0.5,
            })
        }

        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/parse', { method: 'POST', body: formData })
            if (!res.ok) throw new Error((await res.json()).error || 'Processing failed')
            onFileProcessed(await res.json(), file.name)
        } catch (err) {
            alert('Error: ' + err.message)
            setIsProcessing(false)
        }
    }

    return (
        <section>
            <div
                ref={cardRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="card"
                style={{
                    cursor: 'pointer', textAlign: 'center', padding: '72px 40px',
                    perspective: '800px', transformStyle: 'preserve-3d',
                    ...(isDragging ? {
                        borderColor: 'var(--color-accent)',
                        background: 'var(--color-accent-soft)',
                        boxShadow: '0 0 80px rgba(212,168,67,0.1)',
                    } : {}),
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />

                {isProcessing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '200px', height: '6px', background: 'var(--color-surface-3)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div className="processing-bar" style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '999px', width: '30%' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500 }}>Analyzing your results…</p>
                        <style>{`
              @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
              .processing-bar { animation: slide 1.4s ease-in-out infinite; }
            `}</style>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div ref={iconRef} style={{
                            width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div>
                            <p ref={textRef} className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', marginBottom: '6px' }}>
                                Drop your <em className="shimmer-text" style={{ fontStyle: 'italic' }}>result PDF</em>
                            </p>
                            <p ref={subRef} style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>or click anywhere to browse</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
