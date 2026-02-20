"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  getCashflowExpenseTotalsByCategory,
  CategoryGroupMode,
} from "@/lib/cashflow-utils"
import { CashflowEntry } from "@/lib/types"
import { formatCurrency } from "@/lib/ledger-utils"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"

interface CashflowCategoryChartProps {
  entries: CashflowEntry[]
}

export function CashflowCategoryChart({ entries }: CashflowCategoryChartProps) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<CategoryGroupMode>("first-level")

  const data = getCashflowExpenseTotalsByCategory(entries, mode)

  if (data.length === 0) return null

  const chartData = data.map((item) => ({
    category: item.category || t("cashflow.noCategory"),
    total: item.total,
  }))

  const chartHeight = Math.max(120, chartData.length * 36 + 40)

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {t("cashflow.categoryBreakdown")}
        </span>
        <div className="flex gap-1">
          <Button
            variant={mode === "first-level" ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 font-mono text-[10px]"
            onClick={() => setMode("first-level")}
          >
            {t("cashflow.groupByFirstLevel")}
          </Button>
          <Button
            variant={mode === "full" ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 font-mono text-[10px]"
            onClick={() => setMode("full")}
          >
            {t("cashflow.groupByFullCategory")}
          </Button>
        </div>
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [
                formatCurrency(value as number),
                t("cashflow.expenses"),
              ]}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar
              dataKey="total"
              fill="hsl(var(--ledger-red))"
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
