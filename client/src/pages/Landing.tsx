import { Link } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { useRef, useState } from 'react'

export default function Landing() {
	const { uploadCsv, loadSample, students } = useData()
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)

	async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		setUploading(true)
		await uploadCsv(file)
		setUploading(false)
	}

	return (
		<div className="container">
			<header className="hero">
				<h1>School360 POC</h1>
				<p className="subtitle">One student view, three perspectives: Teacher, Parent, and Student.</p>
			</header>

			<section className="upload">
				<h2>1) Upload Class CSV</h2>
				<p>Upload a CSV with columns: studentId, name, learningStyle, subject, date (YYYY-MM-DD), grade (0-100), attendance (0/1), notes.</p>
				<div className="upload-actions">
					<button onClick={() => inputRef.current?.click()} disabled={uploading}>
						{uploading ? 'Uploading…' : 'Upload CSV'}
					</button>
					<input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileChange} />
					<button onClick={() => loadSample()} disabled={uploading}>Use Sample Data</button>
					<a className="link" href="/sample-students.csv" download>
						Download CSV Template
					</a>
				</div>
				{students.length > 0 && <p className="muted">Loaded {students.length} students.</p>}
			</section>

			<section className="roles">
				<h2>2) Choose Your View</h2>
				<div className="role-grid">
					<Link to="/teacher" className="role-card teacher">
						<h3>Teacher</h3>
						<p>Class overview, student snapshots, and PTM summaries.</p>
					</Link>
					<Link to="/parent" className="role-card parent">
						<h3>Parent</h3>
						<p>Friendly progress updates and weekly action items.</p>
					</Link>
					<Link to="/student" className="role-card student">
						<h3>Student</h3>
						<p>Personal progress, streaks, and bite-sized suggestions.</p>
					</Link>
				</div>
			</section>
		</div>
	)
}