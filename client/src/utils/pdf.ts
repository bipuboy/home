import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function downloadElementAsPdf(element: HTMLElement, filename: string) {
	const canvas = await html2canvas(element, { scale: 2 })
	const imgData = canvas.toDataURL('image/png')
	const pdf = new jsPDF('p', 'mm', 'a4')
	const pageWidth = pdf.internal.pageSize.getWidth()
	const pageHeight = pdf.internal.pageSize.getHeight()
	const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
	const imgWidth = canvas.width * ratio
	const imgHeight = canvas.height * ratio
	const x = (pageWidth - imgWidth) / 2
	const y = 10
	pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
	pdf.save(`${filename}.pdf`)
}