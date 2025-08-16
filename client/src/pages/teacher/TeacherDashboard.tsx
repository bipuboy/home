import { Link } from 'react-router-dom'
import { useData } from '../../state/DataContext'
import { useRef } from 'react'

export default function TeacherDashboard() {
	const { students, uploadCsv } = useData()
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className="page">
			<header className="page-header">
				<h2>Teacher Dashboard</h2>
				<div className="header-actions">
					<button onClick={() => inputRef.current?.click()}>Upload CSV</button>
					<input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={async (e) => {
						const f = e.target.files?.[0]
						if (f) await uploadCsv(f)
					}} />
					<Link to="/">Home</Link>
				</div>
			</header>
			<div className="grid">
				{students.map((s) => (
					<Link key={s.id} to={`/teacher/student/${s.id}`} className="student-card">
						<div className="avatar">{s.name.slice(0, 1)}</div>
						<div className="info">
							<h3>{s.name}</h3>
							<p className="tag">Learns best: {s.learningStyle}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}