"use client"

import type React from "react"

import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import type { WellnessMetric } from "@/types/wellness"

interface MobileMetricInputProps {
  metric: WellnessMetric
  value: number
  onChange: (value: number) => void
}

export function MobileMetricInput({ metric, value, onChange }: MobileMetricInputProps) {
  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value)
    if (!isNaN(newValue) && newValue >= metric.min && newValue <= metric.max) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">{metric.name}</label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={metric.min}
            max={metric.max}
            step={metric.step || 1}
            className="h-8 w-16 text-right text-sm"
          />
          <span className="text-xs text-muted-foreground">{metric.unit}</span>
        </div>
      </div>

      <Slider
        value={[value]}
        min={metric.min}
        max={metric.max}
        step={metric.step || 1}
        onValueChange={handleSliderChange}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {metric.min} {metric.unit}
        </span>
        <span>
          {metric.max} {metric.unit}
        </span>
      </div>
    </div>
  )
}
