import { type coinDto } from "../modals/coinDto.ts"

const seed: [string, number][] = [
    ["Bitcoin", 67000], ["Ethereum", 3400], ["Tether", 1], ["BNB", 580],
    ["Solana", 150], ["USD Coin", 1], ["XRP", 0.52], ["Dogecoin", 0.12],
    ["Toncoin", 6.5], ["Cardano", 0.45], ["Avalanche", 28], ["Shiba Inu", 0.000018],
    ["TRON", 0.12], ["Polkadot", 6.2], ["Chainlink", 14], ["Bitcoin Cash", 380],
    ["Polygon", 0.55], ["Litecoin", 72], ["NEAR Protocol", 5.1], ["Uniswap", 7.8],
    ["Internet Computer", 9.4], ["Dai", 1], ["Ethereum Classic", 22], ["Aptos", 7.6],
    ["Stellar", 0.1], ["Cosmos", 6.8], ["Monero", 160], ["Filecoin", 4.3],
    ["Hedera", 0.07], ["Arbitrum", 0.75], ["Cronos", 0.09], ["Optimism", 1.7],
    ["VeChain", 0.025], ["Algorand", 0.15], ["The Graph", 0.18], ["Aave", 95],
    ["Sui", 0.95], ["Fantom", 0.5], ["Tezos", 0.7], ["Pepe", 0.00001],
]

export const coins: coinDto[] = seed.map(([coinName, coinValue], i) => ({
    coinId: i + 1,
    lastUpdate: new Date(Date.now() - i * 60_000),   // each one a minute older
    coinName,
    coinValue,
}))