import express, { type Express, type Request, type Response } from 'express'
import cors from "cors"
import { type coinReponseDto, type coinDto } from './modals/coinDto.ts'
import { coins } from './data/coins.ts'
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


app.get('/', (req: Request, res: Response) => {
    const parsed = coinsQuery.safeParse(req.query)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues })
    }
    const { page, limit, search } = parsed.data
    let coinsResult = search ? coins.filter((x) => x.coinName.toLowerCase().includes(search.toLocaleLowerCase())) : coins
    console.log(coinsResult)
    coinsResult = coinsResult.slice((page - 1) * limit, (page - 1) * limit + limit)
    let coinReponseDto: coinReponseDto = {
        coins: coinsResult,
        total: coins.length
    }
    res.send(coinReponseDto)
})

app.listen(port, () => {
    console.log(`server listens on port ${port}`)
})
