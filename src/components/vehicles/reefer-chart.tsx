
"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  temp: {
    label: "Température",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface ReeferChartProps {
    temperatureData: {time: string, temp: number}[];
}

export function ReeferChart({ temperatureData }: ReeferChartProps) {
    return (
        <div className="h-[200px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart accessibilityLayer data={temperatureData} margin={{top:5, right:10, left:10, bottom:0}}>
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide/>
                    <XAxis dataKey="time" hide/>
                    <Line dataKey="temp" type="monotone" stroke="var(--color-temp)" strokeWidth={2} dot={true}/>
                </LineChart>
            </ChartContainer>
        </div>
    )
}

    