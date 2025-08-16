import { useParams, Link } from 'react-router-dom'
import { useMemo, useRef } from 'react'
import { useData } from '../../state/DataContext'
import { learningStyleStrategies, teacherPTMSummary } from '../../utils/reco.ts'
import { downloadElementAsPdf } from '../../utils/pdf.ts'

export default function TeacherStudentSnapshot() {
	const { id } = useParams()
	const { students, metrics } = useData()
	const student = students.find((s) => s.id === id)
	const m = student ? metrics[student.id] : undefined
	const ref = useRef<HTMLDivElement>(null)

	const strategies = useMemo(() => {
		if (!student) return [] as string[]
		return learningStyleStrategies(student.learningStyle).teacher
	}, [student])

	if (!student || !m) {
		return (
			<div className="page">
				<p>No student found.</p>
				<Link to="/teacher">Back</Link>
			</div>
		)
	}

	return (
		<div className="page">
			<header className="page-header">
				<h2>Student Snapshot</h2>
				<Link to="/teacher">Back to Class</Link>
			</header>

			<div className="snapshot" ref={ref}>
				<div className="snapshot-header">
					<div className="avatar lg">{student.name.slice(0, 1)}</div>
					<div>
						<h3>{student.name}</h3>
						<p className="tag">Learning Style: {student.learningStyle}</p>
					</div>
				</div>

				<div className="snapshot-grid">
					<section>
						<h4>Strengths</h4>
						<ul>
							{m.strengths.map((s) => (
								<li key={s.subject}>{s.subject}: {s.average.toFixed(1)}</li>
							))}
						</ul>
					</section>
					<section>
						<h4>Gaps</h4>
						<ul>
							{m.gaps.map((g) => (
								<li key={g.subject}>{g.subject}: {g.average.toFixed(1)}</li>
							))}
						</ul>
					</section>
					<section>
						<h4>Suggested Teaching Strategies</h4>
						<ul>
							{strategies.map((t, idx) => (
								<li key={idx}>{t}</li>
							))}
						</ul>
					</section>
					<section>
						<h4>PTM Summary</h4>
						<p>{teacherPTMSummary(student, m)}</p>
					</section>
				</div>
			</div>

			<div className="page-actions">
				<button onClick={() => ref.current && downloadElementAsPdf(ref.current, `${student.name}-PTM-Summary`)}>
					Download PTM PDF
				</button>
			</div>
		</div>
	)
}