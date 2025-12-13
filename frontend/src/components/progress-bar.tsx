import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useLocation } from "react-router"

interface ProgressBarContextType {
    start: () => void
    complete: () => void
}

const ProgressBarContext = createContext<ProgressBarContextType | null>(null)

export function useProgressBar() {
    const context = useContext(ProgressBarContext)
    if (!context) {
        return {
            start: () => {},
            complete: () => {},
        }
    }
    return context
}

function ProgressBarInner() {
    const [progress, setProgress] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const location = useLocation()

    const start = useCallback(() => {
        setIsVisible(true)
        setProgress(0)

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval)
                    return 90
                }
                return prev + Math.random() * 15
            })
        }, 100)

        return () => {
            clearInterval(interval)
        }
    }, [])

    const complete = useCallback(() => {
        setProgress(100)
        setTimeout(() => {
            setIsVisible(false)
            setProgress(0)
        }, 200)
    }, [])

    // Auto-start on route change
    useEffect(() => {
        const cleanup = start()
        const timeout = setTimeout(() => {
            complete()
        }, 500)

        return () => {
            cleanup?.()
            clearTimeout(timeout)
        }
    }, [location.pathname, start, complete])

    // Expose methods via context
    useEffect(() => {
        const context = {
            start,
            complete,
        }
        // Store in window for global access
        ;(window as any).__PROGRESS_BAR__ = context
    }, [start, complete])

    if (!isVisible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
            <div
                className="h-full bg-primary transition-all duration-200 ease-out shadow-sm"
                style={{
                    width: `${Math.min(progress, 100)}%`,
                }}
            />
        </div>
    )
}

export function ProgressBar() {
    return (
        <ProgressBarContext.Provider value={null}>
            <ProgressBarInner />
        </ProgressBarContext.Provider>
    )
}

