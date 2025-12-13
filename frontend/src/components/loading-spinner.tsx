import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
    className?: string
    size?: "sm" | "md" | "lg"
    fullScreen?: boolean
}

export function LoadingSpinner({ className, size = "md", fullScreen = false }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    }

    const spinner = (
        <div className={cn("flex items-center justify-center", className)}>
            <div
                className={cn(
                    "animate-spin rounded-full border-4 border-orange-200 border-t-orange-500",
                    sizeClasses[size]
                )}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {spinner}
            </div>
        )
    }

    return spinner
}

