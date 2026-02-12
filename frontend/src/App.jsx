import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import Upload from './components/Upload'
import CachedResults from './components/CachedResults'
import Dashboard from './components/Dashboard'
import FloatingShapes from './components/FloatingShapes'

function App() {
  const [resultData, setResultData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [cachedResults, setCachedResults] = useState([])
  const logoRef = useRef(null)
  const taglineRef = useRef(null)
  const contentRef = useRef(null)
  const footerRef = useRef(null)

  useEffect(() => { loadCachedResults() }, [])

  // Handle Browser Navigation (Path & Back Button)
  useEffect(() => {
    const handlePopState = (event) => {
      // If we go back to home path, clear results
      const path = window.location.pathname
      if (path === '/home' || path === '/') {
        setResultData(null)
        setFileName('')
        loadCachedResults()
      }
    }

    // Initial Path Logic
    const path = window.location.pathname

    // Redirect root to /home
    if (path === '/') {
      window.history.replaceState(null, '', '/home')
    }
    // Check path on initial load for /results
    else if (path === '/results' && !resultData) {
      // If on /results but no data, redirect to home
      window.history.replaceState(null, '', '/home')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Landing page entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

    // Logo text
    if (logoRef.current) {
      gsap.set(logoRef.current, { opacity: 0, y: 20 })
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      }, 0.2)
    }

    // Tagline
    if (taglineRef.current) {
      gsap.set(taglineRef.current, { opacity: 0, y: 15 })
      tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.4)
    }

    // Right tagline
    const rightTag = document.querySelector('#header-tagline')
    if (rightTag) {
      gsap.set(rightTag, { opacity: 0, x: 20 })
      tl.to(rightTag, { opacity: 1, x: 0, duration: 0.8 }, 0.6)
    }

    // Content area
    if (contentRef.current) {
      gsap.set(contentRef.current, { opacity: 0, y: 40 })
      tl.to(contentRef.current, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.5)
    }

    // Footer
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 0 })
      tl.to(footerRef.current, { opacity: 1, duration: 0.8 }, 1.2)
    }

    return () => tl.kill()
  }, [resultData])

  const loadCachedResults = async () => {
    try {
      // Try static index first (fastest, no server wake)
      const staticRes = await fetch('/data/index.json')
      if (staticRes.ok) {
        setCachedResults(await staticRes.json())
        return
      }

      // Fallback to API (wakes server)
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiUrl}/api/cache`)
      if (res.ok) setCachedResults(await res.json())
    } catch (e) {
      console.error('Cache load failed:', e)
      // Try API if static failed completely
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${apiUrl}/api/cache`)
        if (res.ok) setCachedResults(await res.json())
      } catch (err) { console.error('API cache load failed:', err) }
    }
  }

  const handleFileProcessed = (data, name) => {
    setResultData(data)
    setFileName(name)
    // Push history state so back button works AND URL updates
    window.history.pushState({ hasResult: true }, '', '/results')
  }

  const handleLoadCached = async (hash) => {
    try {
      // Try static file first
      const staticRes = await fetch(`/data/${hash}.json`)
      if (staticRes.ok) {
        const data = await staticRes.json()
        setResultData(data)
        setFileName(data.meta?.filename || 'Cached Result')
        // Push history state so back button works AND URL updates
        window.history.pushState({ hasResult: true }, '', '/results')
        return
      }

      // Fallback to API
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiUrl}/api/results/${hash}`)
      if (!res.ok) throw new Error('Load failed')
      const data = await res.json()
      setResultData(data)
      setFileName(data.meta?.filename || 'Cached Result')
      // Push history state so back button works AND URL updates
      window.history.pushState({ hasResult: true }, '', '/results')
    } catch (e) { console.error('Error:', e) }
  }

  const handleReset = () => {
    // If we have history state, go back (triggering popstate logic)
    if (window.history.state?.hasResult) {
      window.history.back()
    } else {
      // Fallback manual reset to home
      window.history.replaceState(null, '', '/home')
      setResultData(null)
      setFileName('')
      loadCachedResults()
    }
  }

  return (
    <>
      <FloatingShapes />

      <div className="relative z-10 min-h-screen" style={{ padding: '48px clamp(24px, 5vw, 80px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header */}
          <header style={{ marginBottom: '56px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              {/* Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {/* Wordmark */}
                <h1
                  ref={logoRef}
                  style={{
                    fontSize: 'clamp(3.5rem, 6vw, 4.5rem)',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.9,
                    color: '#FAFAF9', // Solid white
                  }}
                >
                  Syllabix
                </h1>
                <p ref={taglineRef} style={{
                  fontSize: '15px', color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--font-body)',
                }}>
                  University Result Intelligence
                </p>
              </div>
            </div>
            <div id="header-tagline" style={{ display: 'none', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
                Workflow
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Upload → Analyze → Discover
              </p>
            </div>
          </header>

          <div ref={contentRef}>
            {!resultData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <Upload onFileProcessed={handleFileProcessed} />
                {cachedResults.length > 0 && (
                  <CachedResults results={cachedResults} onSelect={handleLoadCached} />
                )}
              </div>
            ) : (
              <Dashboard data={resultData} fileName={fileName} onReset={handleReset} />
            )}
          </div>

          {/* Footer */}
          <footer ref={footerRef} style={{
            marginTop: '80px', paddingTop: '24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#FAFAF9' }}>
                Syllabix
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                · Built for students ✦
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Made by Aadit
            </p>
          </footer>
        </div>

        <style>{`
          @media (min-width: 768px) {
            #header-tagline { display: block !important; }
          }
        `}</style>
      </div>
    </>
  )
}

export default App
