import dotenv from 'dotenv'
dotenv.config()

import { createApp } from './app.js'
import { iniciarRecordatorios } from './recordatorios.js'

const port = Number(process.env.PORT || 4000)
const app = createApp()

app.listen(port, () => {
  console.log(`VetAdmin API listening on http://localhost:${port}`)
  iniciarRecordatorios()
})
