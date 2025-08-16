import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { parseISO } from 'date-fns'

export type LearningStyle = 'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing' | 'Logical'

export interface CsvRow {
	studentId: string
	name: string
	subject: string
	date: string
	grade: string
	attendance: string
	notes?: string
	learningStyle: LearningStyle
}

export interface RecordRow {
	date: Date
	subject: string
	grade: number
	attendance: number
	note?: string
}

export interface Student {
	id: string
	name: string
	learningStyle: LearningStyle
	records: RecordRow[]
	notes: string[]
}

export interface ProcessedMetrics {
	overallAverageGrade: number
	attendanceRate: number
	subjectAverages: Record<string, number>
	trendByDate: Array<{ date: Date; avgGrade: number; attendance: number }>
	strengths: Array<{ subject: string; average: number }>
	gaps: Array<{ subject: string; average: number }>
	bestImprovement?: { subject: string; delta: number }
	currentStreakDays: number
}

interface DataContextValue {
	students: Student[]
	metrics: Record<string, ProcessedMetrics>
	selectedStudentId?: string
	setSelectedStudentId: (id?: string) => void
	uploadCsv: (file: File) => Promise<void>
	loadSample: () => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

function coerceNumber(value: string): number {
	const n = Number(value)
	return Number.isFinite(n) ? n : 0
}

function computeMetrics(student: Student): ProcessedMetrics {
	if (student.records.length === 0) {
		return {
			overallAverageGrade: 0,
			attendanceRate: 0,
			subjectAverages: {},
			trendByDate: [],
			strengths: [],
			gaps: [],
			currentStreakDays: 0,
		}
	}

	const bySubject: Record<string, { total: number; count: number }> = {}
	const byDate: Record<string, { grades: number[]; attendance: number[] }> = {}

	for (const r of student.records) {
		bySubject[r.subject] = bySubject[r.subject] || { total: 0, count: 0 }
		bySubject[r.subject].total += r.grade
		bySubject[r.subject].count += 1

		const key = r.date.toISOString().slice(0, 10)
		byDate[key] = byDate[key] || { grades: [], attendance: [] }
		byDate[key].grades.push(r.grade)
		byDate[key].attendance.push(r.attendance)
	}

	const subjectAverages: Record<string, number> = {}
	Object.entries(bySubject).forEach(([s, v]) => {
		subjectAverages[s] = v.total / Math.max(1, v.count)
	})

	const overallAverageGrade =
		Object.values(subjectAverages).reduce((a, b) => a + b, 0) /
		Math.max(1, Object.keys(subjectAverages).length)

	const trendByDate = Object.entries(byDate)
		.map(([k, v]) => ({
			date: parseISO(k),
			avgGrade: v.grades.reduce((a, b) => a + b, 0) / Math.max(1, v.grades.length),
			attendance: v.attendance.reduce((a, b) => a + b, 0) / Math.max(1, v.attendance.length),
		}))
		.sort((a, b) => a.date.getTime() - b.date.getTime())

	const attendanceRate =
		trendByDate.reduce((a, p) => a + p.attendance, 0) / Math.max(1, trendByDate.length)

	const subjectsSorted = Object.entries(subjectAverages)
		.map(([subject, average]) => ({ subject, average }))
		.sort((a, b) => b.average - a.average)

	const strengths = subjectsSorted.slice(0, 3)
	const gaps = subjectsSorted.slice(-3).reverse()

	// Improvement: subject delta between last and first average per subject
	let bestImprovement: { subject: string; delta: number } | undefined
	Object.keys(subjectAverages).forEach((subject) => {
		const subjectRecords = student.records
			.filter((r) => r.subject === subject)
			.sort((a, b) => a.date.getTime() - b.date.getTime())
		if (subjectRecords.length >= 2) {
			const delta = subjectRecords[subjectRecords.length - 1].grade - subjectRecords[0].grade
			if (!bestImprovement || delta > bestImprovement.delta) {
				bestImprovement = { subject, delta }
			}
		}
	})

	// Streak: consecutive days with attendance == 1 at the end
	let currentStreakDays = 0
	for (let i = trendByDate.length - 1; i >= 0; i--) {
		if (trendByDate[i].attendance >= 0.99) currentStreakDays += 1
		else break
	}

	return {
		overallAverageGrade,
		attendanceRate,
		subjectAverages,
		trendByDate,
		strengths,
		gaps,
		bestImprovement,
		currentStreakDays,
	}
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [students, setStudents] = useState<Student[]>([])
	const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined)

	const metrics = useMemo(() => {
		const map: Record<string, ProcessedMetrics> = {}
		students.forEach((s) => (map[s.id] = computeMetrics(s)))
		return map
	}, [students])

	async function uploadCsv(file: File) {
		const text = await file.text()
		await loadFromCsvText(text)
	}

	async function loadSample() {
		const resp = await fetch('/sample-students.csv')
		const text = await resp.text()
		await loadFromCsvText(text)
	}

	async function loadFromCsvText(text: string) {
		const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true })
		const rows = parsed.data as CsvRow[]
		const studentIdToRows: Record<string, CsvRow[]> = {}
		rows.forEach((r: CsvRow) => {
			if (!r.studentId || !r.name || !r.subject || !r.date) return
			studentIdToRows[r.studentId] = studentIdToRows[r.studentId] || []
			studentIdToRows[r.studentId].push(r)
		})

		const next: Student[] = Object.entries(studentIdToRows).map(([id, sRows]) => {
			const records: RecordRow[] = sRows.map((r) => ({
				date: parseISO(r.date),
				subject: r.subject,
				grade: coerceNumber(r.grade),
				attendance: coerceNumber(r.attendance),
				note: r.notes?.trim() || undefined,
			}))
			records.sort((a, b) => a.date.getTime() - b.date.getTime())
			return {
				id,
				name: sRows[0].name,
				learningStyle: (sRows[0].learningStyle || 'Visual') as LearningStyle,
				records,
				notes: sRows.map((r) => r.notes).filter(Boolean) as string[],
			}
		})

		setStudents(next)
		if (next.length > 0) setSelectedStudentId(next[0].id)
	}

	useEffect(() => {
		// Load sample on first mount
		loadSample().catch(() => {})
	}, [])

	const value: DataContextValue = {
		students,
		metrics,
		selectedStudentId,
		setSelectedStudentId,
		uploadCsv,
		loadSample,
	}

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
	const ctx = useContext(DataContext)
	if (!ctx) throw new Error('useData must be used within DataProvider')
	return ctx
}