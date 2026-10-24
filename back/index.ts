import express, { type Express, type Request, type Response } from 'express'
import cors from "cors"
import { type coinReponseDto } from './modals/coinDto.ts'
import { coinRepository } from './repositories/coinRepository.ts'
import { addClient, removeClient, broadcast } from './sse.ts'
import { notFound } from './middlewares/notFound.ts'
import { errorHandler } from './middlewares/errorHandler.ts'
import { z } from 'zod'

const app: Express = express()
const port = 3000

app.use(cors({
    origin: "http://localhost:5173"
}))
app.use(express.json())



const coinsQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional()
})

const coinIdParam = z.object({
    coinId: z.coerce.number().int().positive()
})

const updateCoinBody = z.object({
    coinValue: z.coerce.number().positive()
})


app.get('/', (req: Request, res: Response) => {
    const parsed = coinsQuery.safeParse(req.query)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues })
    }
    const { page, limit, search } = parsed.data
    const allCoins = coinRepository.findAll()
    let coinsResult = search ? allCoins.filter((x) => x.coinName.toLowerCase().includes(search.toLocaleLowerCase())) : allCoins

    coinsResult = coinsResult.slice((page - 1) * limit, (page - 1) * limit + limit)
    let coinReponseDto: coinReponseDto = {
        coins: coinsResult,
        total: allCoins.length
    }
    res.send(coinReponseDto)
})

app.get('/coins/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    addClient(res)
    req.on('close', () => removeClient(res))
})

app.patch('/coins/:coinId', (req: Request, res: Response) => {
    const parsedParams = coinIdParam.safeParse(req.params)
    if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.issues })
    }
    const parsedBody = updateCoinBody.safeParse(req.body)
    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues })
    }

    const coin = coinRepository.updateValue(parsedParams.data.coinId, parsedBody.data.coinValue)
    if (!coin) {
        return res.status(404).json({ error: 'Coin not found' })
    }

    broadcast('coin-update', coin)

    res.send(coin)
})

app.use(notFound)
app.use(errorHandler)

app.listen(port, () => {
    console.log(`server listens on port ${port}`)
})
