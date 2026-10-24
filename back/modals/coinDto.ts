export type coinDto = {
    coinId: number,
    lastUpdate: Date,
    coinName: string,
    coinValue: number
}

export type coinReponseDto = {
    coins: coinDto[],
    total: number
}