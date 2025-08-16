import express from 'express'
import path from 'path'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
	res.json({ ok: true })
})

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
	res.sendFile(path.join(clientDist, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server listening on :${PORT}`))