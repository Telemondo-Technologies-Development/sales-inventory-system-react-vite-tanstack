
import {
  Chart,
  ChartHeader,
  ChartTitle,
  ChartContent,
  LineChart as LineChartSVG,
  BarChart as BarChartSVG,
  PieChart as PieChartSVG,
} from "@/components/ui/chart"

type RevDatum = { date: string; total: number }
type OrdersDatum = { date: string; count: number }
type TopItem = { name: string; qty: number }

const COLORS = ["#6366F1", "#8B5CF6", "#60A5FA", "#F59E0B", "#EF4444", "#10B981", "#EC4899", "#3B82F6"]

export function RevenueLineChart({ data }: { data: RevDatum[] }) {
  // sort by date ascending before rendering
  const sorted = (data || []).slice().sort((a, b) => {
    const ta = Number(new Date(a.date)) || 0
    const tb = Number(new Date(b.date)) || 0
    return ta - tb
  })

  return (
    <Chart className="w-full">
      <ChartHeader>
        <ChartTitle>Revenue (by day)</ChartTitle>
      </ChartHeader>
      <ChartContent style={{ width: "100%", height: 300, minWidth: 0, minHeight: 0 }}>
        <LineChartSVG data={sorted} height={300} />
      </ChartContent>
    </Chart>
  )
}

export function SalesBarChart({ data }: { data: OrdersDatum[] }) {
  const sorted = (data || []).slice().sort((a, b) => {
    const ta = Number(new Date(a.date)) || 0
    const tb = Number(new Date(b.date)) || 0
    return ta - tb
  })

  return (
    <Chart className="w-full">
      <ChartHeader>
        <ChartTitle>Orders (by day)</ChartTitle>
      </ChartHeader>
      <ChartContent style={{ width: "100%", height: 300, minWidth: 0, minHeight: 0 }}>
        <BarChartSVG data={sorted} height={300} />
      </ChartContent>
    </Chart>
  )
}

export function TopItemsPie({ data }: { data: TopItem[] }) {
  const total = data.reduce((s, d) => s + d.qty, 0)
  const pieData = data.map((d, i) => ({ name: d.name, value: d.qty, color: COLORS[i % COLORS.length] }))
  return (
    <Chart className="w-full">
      <ChartHeader>
        <ChartTitle>Top Sold Items</ChartTitle>
      </ChartHeader>
      <ChartContent style={{ padding: 16 }}>
        <div className="flex gap-6 items-center w-full" style={{ minWidth: 0 }}>
          <div style={{ width: 380, height: 320, minWidth: 0, minHeight: 0 }}>
            <PieChartSVG data={pieData} size={320} />
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Top items (by qty)</div>
            <ul className="space-y-1">
              {data.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-gray-500">{d.qty} units • {(d.qty / total * 100).toFixed(1)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ChartContent>
    </Chart>
  )
}