import { useMemo } from 'react'
import { useData } from '../../state/DataContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { studentSuggestions, motivationalFeedback } from '../../utils/reco.ts'

export default function StudentDashboard() {
	const { students, metrics } = useData()
	const student = students[0]
	const m = student ? metrics[student.id] : undefined

	const data = useMemo(() => {
		if (!m) return [] as Array<{ date: string; grade: number }>
		return m.trendByDate.map((p) => ({
			date: p.date.toISOString().slice(0, 10),
			grade: Number(p.avgGrade.toFixed(1)),
		}))
	}, [m])

	if (!student || !m) return <div className="page"><p>Load sample data on Home to begin.</p></div>

	return (
		<div className="page">
			<header className="page-header">
				<h2>Student Dashboard</h2>
			</header>

			<section>
				<div className="topbar">
					<span className="tag">Best learns through: {student.learningStyle}</span>
					<span className="tag">Attendance streak: {m.currentStreakDays} days</span>
				</div>
			</section>

			<section>
				<h3>Your Progress</h3>
				<div style={{ width: '100%', height: 280 }}>
					<ResponsiveContainer>
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis domain={[0, 100]} />
							<Tooltip />
							<Line type="monotone" dataKey="grade" stroke="#a855f7" name="Grade" />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</section>

			<section>
				<h3>Suggestions</h3>
				<ul>
					{studentSuggestions(student).map((s, i) => (
						<li key={i}>{s}</li>
					))}
				</ul>
			</section>

			<section>
				<h3>Good News</h3>
				<p>{motivationalFeedback(student, m)}</p>
			</section>
		</div>
	)
}