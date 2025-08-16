import { useMemo } from 'react'
import { useData } from '../../state/DataContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { parentUpdateSummary, parentActionItems } from '../../utils/reco.ts'

export default function ParentDashboard() {
	const { students, metrics } = useData()
	const student = students[0]
	const m = student ? metrics[student.id] : undefined

	const data = useMemo(() => {
		if (!m) return [] as Array<{ date: string; grade: number; attendance: number }>
		return m.trendByDate.map((p) => ({
			date: p.date.toISOString().slice(0, 10),
			grade: Number(p.avgGrade.toFixed(1)),
			attendance: Number((p.attendance * 100).toFixed(0)),
		}))
	}, [m])

	if (!student || !m) return <div className="page"><p>Load sample data on Home to begin.</p></div>

	return (
		<div className="page">
			<header className="page-header">
				<h2>Parent Dashboard</h2>
			</header>

			<section>
				<h3>{student.name} – Progress Trends</h3>
				<div style={{ width: '100%', height: 320 }}>
					<ResponsiveContainer>
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis yAxisId="left" domain={[0, 100]} />
							<YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
							<Tooltip />
							<Legend />
							<Line yAxisId="left" type="monotone" dataKey="grade" stroke="#3b82f6" name="Grade" />
							<Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#22c55e" name="Attendance %" />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</section>

			<section>
				<h3>Updates</h3>
				<p>{parentUpdateSummary(student, m)}</p>
			</section>

			<section>
				<h3>Action Plan</h3>
				<ul>
					{parentActionItems(student).map((a, i) => (
						<li key={i}>{a}</li>
					))}
				</ul>
			</section>
		</div>
	)
}