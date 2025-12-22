import * as React from "react"

export function Card({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`rounded-2xl bg-primary-foreground border border-border overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`px-4 py-3 border-b border-border ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`text-lg font-semibold text-primary ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`px-4 py-3 border-t border-border ${className}`}>
      {children}
    </div>
  )
}

export default Card
