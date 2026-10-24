import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useRef } from "react"

type coin = {
    coinId: number,
    lastUpdate: string,
    coinName: string,
    coinValue: number
}

export function DashBoard() {

    const [coins, setCoins] = useState<coin[]>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchQuery, setSearchQuery] = useState<string>()
    const [q, setQ] = useState<string>(searchParams.get("search") ?? "")
    const [currentPage, setCurrentPage] = useState<string>(searchParams.get("page") ?? "1")

    let limit = searchParams.get("limit") ?? 12
    let total = useRef(10)
    console.log(total.current / +limit)

    useEffect(() => {
        //async call
        async function fetchCoins(): Promise<void> {

            const params = new URLSearchParams({ page: currentPage, limit: limit.toString(), search: q })
            const res = await fetch(`http://localhost:3000/?${params}`)
            if (!res.ok) throw new Error('Request Failed')
            const data = await res.json()
            setSearchParams(params)
            setCoins(data.coins)
            total.current = data.total
        }
        fetchCoins()
    }, [q, currentPage, limit])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setCurrentPage("1")
            setQ(searchQuery ?? "")
        }, 400)
        return () => clearTimeout(timeout)
    }, [searchQuery])

    function changePage(pagesToChange: number): void {
        setCurrentPage((+currentPage + pagesToChange).toString())
    }

    return (
        <div>
            <input type="text" onChange={(e) => {
                setSearchQuery(e.target.value)
            }} />
            <table border={1}>
                <thead>
                    <tr>
                        <th>Date Updated</th>
                        <th>Coin Name</th>
                        <th>Coin Value</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        coins?.map(coin => {
                            return (
                                < tr key={coin.coinId}>
                                    <td>{coin.lastUpdate}</td>
                                    <td>{coin.coinName}</td>
                                    <td>{coin.coinValue}$</td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
            <button disabled={currentPage == "1"} onClick={() => changePage(-1)}>Prev</button>
            <button disabled={currentPage == (Math.ceil(total.current / +limit)).toString()} onClick={() => changePage(1)}>Next</button>
        </div >
    )
}