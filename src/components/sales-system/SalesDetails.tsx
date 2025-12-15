import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

type RevDatum = { date: string; total: number }
type OrdersDatum = { date: string; count: number }
type TopItem = { name: string; qty: number }

const COLORS = ["#6366F1", "#8B5CF6", "#60A5FA", "#F59E0B", "#EF4444", "#10B981", "#EC4899", "#3B82F6"]

export function RevenueLineChart({ data }: { data: RevDatum[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: any) => `₱${Number(v).toFixed(2)}`} />
          <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={3} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SalesBarChart({ data }: { data: OrdersDatum[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#8B5CF6" barSize={18} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopItemsPie({ data }: { data: TopItem[] }) {
  const total = data.reduce((s, d) => s + d.qty, 0)
  const pieData = data.map((d, i) => ({ name: d.name, value: d.qty, color: COLORS[i % COLORS.length] }))
  return (
    <div className="flex gap-6 items-center" style={{ width: "100%" }}>
      <div style={{ width: 380, height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
            <Tooltip formatter={(v: any) => `${v} units`} />
          </PieChart>
        </ResponsiveContainer>
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
  )
}