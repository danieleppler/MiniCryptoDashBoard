import { type coinDto } from "../modals/coinDto.ts"
import { coins } from "../data/coins.ts"

export interface CoinRepository {
    findAll(): coinDto[]
    findById(coinId: number): coinDto | undefined
    updateValue(coinId: number, coinValue: number): coinDto | undefined
}

class InMemoryCoinRepository implements CoinRepository {
    private readonly coins: coinDto[]

    constructor(coins: coinDto[]) {
        this.coins = coins
    }

    findAll(): coinDto[] {
        return this.coins
    }

    findById(coinId: number): coinDto | undefined {
        return this.coins.find((coin) => coin.coinId === coinId)
    }

    updateValue(coinId: number, coinValue: number): coinDto | undefined {
        const coin = this.findById(coinId)
        if (!coin) return undefined

        coin.coinValue = coinValue
        coin.lastUpdate = new Date()
        return coin
    }
}

export const coinRepository: CoinRepository = new InMemoryCoinRepository(coins)
