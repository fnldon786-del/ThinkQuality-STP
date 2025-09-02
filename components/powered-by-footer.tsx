"use client"

interface PoweredByFooterProps {
  className?: string
}

export function PoweredByFooter({ className = "" }: PoweredByFooterProps) {
  return (
    <footer className={`border-t bg-card mt-auto ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>© {new Date().getFullYear()} Business Management System</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Powered by</span>
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">TQ</span>
              </div>
              <span className="font-semibold text-foreground">ThinkQuality</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
