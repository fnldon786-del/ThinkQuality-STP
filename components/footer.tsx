import { Logo } from "./logo"

interface FooterProps {
  customLogo?: string
  customName?: string
}

export function Footer({ customLogo, customName }: FooterProps) {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {(customLogo || customName) && (
            <div className="flex items-center space-x-2">
              <Logo size="sm" customLogo={customLogo} customName={customName} />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Powered by ThinkQuality</span>
        </div>
      </div>
    </footer>
  )
}
