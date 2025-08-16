import type { ProcessedMetrics, Student } from '../state/DataContext'

export function learningStyleStrategies(learningStyle: Student['learningStyle']) {
	switch (learningStyle) {
		case 'Visual':
			return {
				teacher: [
					'Use diagrams and color-coded notes',
					'Incorporate mind maps and infographics',
					'Show worked examples step-by-step',
				],
				student: [
					'Watch a 10-minute concept video',
					'Create a quick sketch of the topic',
				],
			}
		case 'Auditory':
			return {
				teacher: [
					'Leverage short explanations and discussions',
					'Encourage think-aloud problem solving',
					'Use brief peer-teaching segments',
				],
				student: [
					'Record a 1-minute summary in your own words',
					'Explain the concept to a friend or parent',
				],
			}
		case 'Kinesthetic':
			return {
				teacher: [
					'Introduce hands-on activities or manipulatives',
					'Break tasks into short active segments',
					'Use quick experiments or demos',
				],
				student: [
					'Do 5 practice problems with scratch work',
					'Build a mini-model or act out the process',
				],
			}
		case 'Reading/Writing':
			return {
				teacher: [
					'Provide concise handouts and checklists',
					'Use written exit tickets',
					'Offer guided reading with highlights',
				],
				student: [
					'Read a 1-page summary and write key points',
					'Create flashcards for key terms',
				],
			}
		case 'Logical':
		default:
			return {
				teacher: [
					'Emphasize patterns, rules, and stepwise logic',
					'Use quick checks for understanding via mini-quizzes',
					'Encourage problem decomposition',
				],
				student: [
					'Do 5 targeted practice problems',
					'Outline the steps to solve similar tasks',
				],
			}
	}
}

export function teacherPTMSummary(student: Student, m: ProcessedMetrics): string {
	const topStrength = m.strengths[0]?.subject
	const topGap = m.gaps[0]?.subject
	const improvement = m.bestImprovement
	const attendancePct = Math.round(m.attendanceRate * 100)
	const recentNote = student.notes.at(-1)
	const noteFragment = recentNote ? ` Recent note: "${recentNote}"` : ''
	const improvementText = improvement ? ` Noticeable improvement in ${improvement.subject} (+${improvement.delta.toFixed(0)}%).` : ''
	return `${student.name} shows strong performance in ${topStrength ?? 'some subjects'} with an overall average of ${m.overallAverageGrade.toFixed(1)}%. Attendance is ${attendancePct}%.${improvementText} ${topGap ? `Next focus: ${topGap} with targeted practice and support.` : ''}${noteFragment}`
}

export function parentUpdateSummary(student: Student, m: ProcessedMetrics): string {
	const improvement = m.bestImprovement
	const attendancePct = Math.round(m.attendanceRate * 100)
	const recentNote = student.notes.at(-1)
	const noteFragment = recentNote ? ` Teacher note: "${recentNote}".` : ''
	if (improvement && improvement.delta > 0) {
		return `Since last PTM, ${student.name}'s ${improvement.subject} scores improved by ${improvement.delta.toFixed(0)}%. Attendance is steady at ${attendancePct}%. Next step: short daily practice to keep the momentum.${noteFragment}`
	}
	return `${student.name} is progressing steadily. Attendance is ${attendancePct}%. Next step: practice comprehension and review key topics.${noteFragment}`
}

export function parentActionItems(student: Student): string[] {
	const ls = learningStyleStrategies(student.learningStyle).student
	return [
		`This week, help ${student.name} by setting a 15-minute study routine`,
		...ls,
	]
}

export function studentSuggestions(student: Student): string[] {
	const { student: ls } = learningStyleStrategies(student.learningStyle)
	return [
		...ls,
		'Review mistakes from last quiz and fix 2 of them',
	]
}

export function motivationalFeedback(student: Student, m: ProcessedMetrics): string {
	const improvement = m.bestImprovement
	if (improvement && improvement.delta > 0) {
		return `Great job, ${student.name}! You improved ${improvement.delta.toFixed(0)}% in ${improvement.subject}. Keep going—small steps add up!`
	}
	return `You're building consistency, ${student.name}. Keep up the streak and focus on one small win today!`
}