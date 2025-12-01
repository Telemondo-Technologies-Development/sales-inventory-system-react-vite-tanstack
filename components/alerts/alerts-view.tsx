"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react"

interface Alert {
  id: string
  ingredientId: string
  ingredientName: string
  type: "low_stock" | "out_of_stock"
  message: string
  createdAt: string
  resolved: boolean
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = () => {
    const storedAlerts = JSON.parse(localStorage.getItem("alerts") || "[]")
    setAlerts(storedAlerts)
  }

  const resolveAlert = (alertId: string) => {
    const updated = alerts.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
    setAlerts(updated)
    localStorage.setItem("alerts", JSON.stringify(updated))
  }

  const deleteAlert = (alertId: string) => {
    const updated = alerts.filter((alert) => alert.id !== alertId)
    setAlerts(updated)
    localStorage.setItem("alerts", JSON.stringify(updated))
  }

  const activeAlerts = alerts.filter((a) => !a.resolved)
  const resolvedAlerts = alerts.filter((a) => a.resolved)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Inventory Alerts</h1>

      {/* Active Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Active Alerts ({activeAlerts.length})</h2>
        {activeAlerts.length === 0 ? (
          <div className="elevation-1 bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-900 font-semibold">All ingredients are in stock!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="elevation-1 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start justify-between"
              >
                <div className="flex items-start gap-4 flex-1">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-900">{alert.ingredientName} - Low Stock</h3>
                    <p className="text-yellow-800 text-sm mt-1">{alert.message}</p>
                    <p className="text-yellow-700/60 text-xs mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Resolved Alerts ({resolvedAlerts.length})</h2>
          <div className="space-y-3">
            {resolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="elevation-1 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start justify-between opacity-75"
              >
                <div className="flex items-start gap-4 flex-1">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 line-through">{alert.ingredientName} - Low Stock</h3>
                    <p className="text-green-800 text-sm mt-1">{alert.message}</p>
                    <p className="text-green-700/60 text-xs mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
