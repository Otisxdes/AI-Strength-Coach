'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  weight: number
  reps: number
  e1rm: number
}

export default function ExerciseChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={30} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: 12 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#fff' }}
        />
        <Line type="monotone" dataKey="e1rm" name="e1RM (kg)" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
