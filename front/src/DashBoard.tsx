import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useRef } from "react"
import "./DashBoard.css"

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
        const controller = new AbortController()

        //async call
        async function fetchCoins(): Promise<void> {
            try {
                const params = new URLSearchParams({ page: currentPage, limit: limit.toString(), search: q })
                const res = await fetch(`http://localhost:3000/?${params}`, { signal: controller.signal })
                if (!res.ok) throw new Error('Request Failed')
                const data = await res.json()
                setSearchParams(params)
                setCoins(data.coins)
                total.current = data.total
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return
                throw err
            }
        }
        fetchCoins()

        return () => controller.abort()
    }, [q, currentPage, limit])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setCurrentPage("1")
            setQ(searchQuery ?? "")
        }, 400)
        return () => clearTimeout(timeout)
    }, [searchQuery])

    useEffect(() => {
        const eventSource = new EventSource("http://localhost:3000/coins/stream")

        eventSource.addEventListener("coin-update", (event) => {
            const updatedCoin: coin = JSON.parse(event.data)
            setCoins(prev => prev?.map(coin =>
                coin.coinId === updatedCoin.coinId ? updatedCoin : coin
            ))
        })

        return () => eventSource.close()
    }, [])

    function changePage(pagesToChange: number): void {
        setCurrentPage((+currentPage + pagesToChange).toString())
    }

    const totalPages = Math.ceil(total.current / +limit)

    return (
        <div className="dashboard">
            <h1 className="dashboard__title">Crypto Dashboard</h1>
            <input
                className="dashboard__search"
                type="text"
                placeholder="Search coins..."
                onChange={(e) => {
                    setSearchQuery(e.target.value)
                }}
            />
            <div className="dashboard__table-wrap">
                <table className="dashboard__table">
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
                                    <tr key={coin.coinId}>
                                        <td className="dashboard__date">{new Date(coin.lastUpdate).toLocaleString()}</td>
                                        <td>{coin.coinName}</td>
                                        <td className="dashboard__value">${coin.coinValue.toLocaleString()}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
            <div className="dashboard__pagination">
                <span className="dashboard__page-label">Page {currentPage} of {totalPages || 1}</span>
                <button disabled={currentPage == "1"} onClick={() => changePage(-1)}>Prev</button>
                <button disabled={currentPage == totalPages.toString()} onClick={() => changePage(1)}>Next</button>
            </div>
        </div>
    )
}