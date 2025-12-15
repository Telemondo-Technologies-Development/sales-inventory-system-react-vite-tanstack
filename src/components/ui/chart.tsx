import * as React from "react"

export function Chart({ className = "", children, style, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} style={style} className={`rounded-2xl bg-primary-foreground border border-border overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function ChartHeader({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`px-4 py-3 border-b border-border ${className}`}>
      {children}
    </div>
  )
}

export function ChartTitle({ className = "", children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={`text-lg font-semibold text-primary ${className}`}>
      {children}
    </div>
  )
}

export function ChartContent({ className = "", children, style, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} style={style} className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

// Lightweight SVG charts
export function LineChart({ data, height = 300 }: { data: { date: string; total: number }[]; height?: number }) {
  const padding = 24
  const w = 800
  const labelHeight = 28
  const h = height
  const values = data.map((d) => d.total)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const stepX = data.length > 1 ? (w - padding * 2) / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = padding + (1 - (d.total - min) / (max - min || 1)) * (h - padding * 2)
    return [x, y]
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')

  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        <rect x={0} y={0} width={w} height={h} fill="transparent" />
        <polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#e6eef9" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        <path d={path} fill="none" stroke="#6366F1" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={3} fill="#1f4ed8" />
            {/* Value label */}
            <text x={p[0]} y={p[1] - 8} fontSize={11} fill="#6366F1" textAnchor="middle" fontWeight="bold">
              ₱{data[i].total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </text>
          </g>
        ))}
        {/* x-axis labels - show up to 8 labels evenly spaced */}
        {data.length > 0 && (() => {
          const maxLabels = 8
          const step = Math.max(1, Math.ceil(data.length / maxLabels))
          return data.map((d, i) => {
            if (i % step !== 0 && i !== data.length - 1) return null
            const x = padding + i * stepX
            const y = h - 6
            const label = (() => {
              try { return new Date(d.date).toLocaleDateString() } catch { return d.date }
            })()
            return (
              <text key={`lbl-${i}`} x={x} y={y} fontSize={10} fill="#374151" textAnchor="middle">
                {label}
              </text>
            )
          })
        })()}
        {/* Legend */}
        <g>
          <rect x={w - 160} y={16} width={12} height={12} fill="#6366F1" rx={2} />
          <text x={w - 140} y={26} fontSize={12} fill="#374151">Revenue</text>
        </g>
      </svg>
    </div>
  )
}

export function BarChart({ data, height = 300 }: { data: { date: string; count: number }[]; height?: number }) {
  const padding = 24
  const w = 800
  const h = height
  const values = data.map((d) => d.count)
  const max = Math.max(...values, 1)
  const barGap = 8
  const barWidth = data.length ? (w - padding * 2 - (data.length - 1) * barGap) / data.length : 10

  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        <rect x={0} y={0} width={w} height={h} fill="transparent" />
        {data.map((d, i) => {
          const x = padding + i * (barWidth + barGap)
          const barH = ((d.count || 0) / (max || 1)) * (h - padding * 2)
          const y = h - padding - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={Math.max(1, barWidth)} height={barH} rx={6} fill="#8B5CF6" />
              {/* Value label */}
              <text x={x + barWidth / 2} y={y - 6} fontSize={11} fill="#8B5CF6" textAnchor="middle" fontWeight="bold">
                {d.count}
              </text>
            </g>
          )
        })}
        {/* Legend */}
        <g>
          <rect x={w - 160} y={16} width={12} height={12} fill="#8B5CF6" rx={2} />
          <text x={w - 140} y={26} fontSize={12} fill="#374151">Orders</text>
        </g>
      </svg>
      {/* x-axis labels */}
      <div style={{ width: '100%', height: 18 }} aria-hidden>
        <svg viewBox={`0 0 ${w} 18`} width="100%" height="100%" preserveAspectRatio="none">
          {data.length > 0 && (() => {
            const maxLabels = 8
            const step = Math.max(1, Math.ceil(data.length / maxLabels))
            return data.map((d, i) => {
              if (i % step !== 0 && i !== data.length - 1) return null
              const x = padding + i * (barWidth + barGap) + barWidth / 2
              const label = (() => { try { return new Date(d.date).toLocaleDateString() } catch { return d.date } })()
              return (
                <text key={`lbl-${i}`} x={x} y={12} fontSize={10} fill="#374151" textAnchor="middle">
                  {label}
                </text>
              )
            })
          })()}
        </svg>
      </div>
    </div>
  )
}

export function PieChart({ data, size = 320 }: { data: { name: string; value: number; color?: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1
  const r = Math.min(size, size) / 2
  let angle = -Math.PI / 2
  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        {data.map((d, i) => {
          const slice = (d.value || 0) / total
          const delta = slice * Math.PI * 2
          const x1 = cx + r * Math.cos(angle)
          const y1 = cy + r * Math.sin(angle)
          angle += delta
          const x2 = cx + r * Math.cos(angle)
          const y2 = cy + r * Math.sin(angle)
          const large = delta > Math.PI ? 1 : 0
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
          return <path key={i} d={path} fill={d.color || '#ccc'} stroke="#fff" strokeWidth={1} />
        })}
      </svg>
    </div>
  )
}

export default Chart
