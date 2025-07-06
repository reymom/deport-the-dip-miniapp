"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Wallet, TrendingUp, Users, DollarSign, Target, Medal, Trophy } from "lucide-react"
import { useHeadlessDelegatedActions } from "@privy-io/react-auth"
import { usePrivyTelegram } from "@/hooks/usePrivyTelegram"
import type { LeaderboardEntry } from "../types/leaderboard"

const getRankEmoji = (rank: number) => {
    if (rank === 0) return "👑"
    if (rank === 1) return "🚀"
    if (rank === 2) return "🧠"
    if (rank <= 5) return "💎"
    if (rank <= 10) return "🔥"
    return "😭"
}

const getRankColor = (rank: number) => {
    if (rank === 0) return "from-yellow-500 to-amber-500"
    if (rank === 1) return "from-gray-400 to-gray-500"
    if (rank === 2) return "from-orange-500 to-amber-600"
    if (rank <= 5) return "from-blue-500 to-purple-500"
    if (rank <= 10) return "from-green-500 to-emerald-500"
    return "from-slate-500 to-slate-600"
}

const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5" />
    if (rank === 1) return <Trophy className="w-5 h-5" />
    if (rank === 2) return <Medal className="w-5 h-5" />
    return <Target className="w-4 h-4" />
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [followed, setFollowed] = useState<Set<string>>(new Set());
    const [loadingFollows, setLoadingFollows] = useState(true);
    const [following, setFollowing] = useState<string | null>(null)
    const { delegateWallet } = useHeadlessDelegatedActions()
    const { evmAddress, authenticated, walletsReady, telegramUserId } = usePrivyTelegram({ autoConnect: true })

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard")
                const data = await res.json()
                setEntries(data.entries)
            } catch (err) {
                console.error("Failed to load leaderboard", err)
                toast.error("Failed to load leaderboard")
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    useEffect(() => {
        if (!walletsReady || !evmAddress) return;

        (async () => {
            try {
                const r = await fetch(`/api/follows?addr=${evmAddress}`);
                const arr: string[] = await r.json();
                setFollowed(new Set(arr.map((s) => s.toLowerCase())));
            } finally {
                setLoadingFollows(false);
            }
        })();
    }, [walletsReady, evmAddress]);

    const handleToggleFollow = async (leader: string) => {
        if (!authenticated || !walletsReady) {
            toast.error("Please connect your wallet first")
            return
        }

        setFollowing(leader);
        const isFollowed = followed.has(leader.toLowerCase());

        try {
            if (isFollowed) {
                // Unfollow
                await fetch(`${process.env.NEXT_PUBLIC_BOT_URL}/unfollow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        telegram_user_id: telegramUserId,
                        leader_address: leader,
                        follower_address: evmAddress,
                    }),
                });
                setFollowed((prev) => {
                    const n = new Set(prev); n.delete(leader.toLowerCase()); return n;
                });
                toast.success("Unfollowed");
            } else {
                await delegateWallet({
                    address: evmAddress!,
                    chainType: "ethereum",
                })
                const resp = await fetch(`${process.env.NEXT_PUBLIC_BOT_URL}/follow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        telegram_user_id: telegramUserId,
                        leader_address: leader,
                        follower_address: evmAddress
                    }),
                });
                if (!resp.ok) {
                    const err = await resp.text();
                    throw new Error(`Bot HTTP ${resp.status}: ${err}`);
                }
                toast.success(`Now following ${leader.slice(0, 6)}...${leader.slice(-4)}! 🎯`)
            }
        } catch (err) {
            console.error("Delegation error:", err)
            toast.error("Failed to follow trader 😓")
        } finally {
            setFollowing(null)
        }
    }


    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
        return `$${value.toFixed(2)}`
    }

    const formatPnL = (pnl: number) => {
        const isPositive = pnl >= 0
        const formatted = formatCurrency(Math.abs(pnl))
        return {
            value: `${isPositive ? "+" : "-"}${formatted}`,
            color: isPositive ? "text-green-400" : "text-red-400",
            bgColor: isPositive ? "bg-green-500/10" : "bg-red-500/10",
            borderColor: isPositive ? "border-green-500/20" : "border-red-500/20",
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
                    <p className="text-white">Loading the best traders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg meme-text flex justify-center items-center gap-3">
                    <Crown className="text-yellow-400 w-8 h-8" />
                    LEADERBOARD
                </h1>
                <p className="text-blue-200 font-medium">Top memecoin commanders. Follow them into battle 🪖</p>
                <div className="flex justify-center gap-4 text-sm text-slate-400">
                    <span>👑 Champions</span>
                    <span>🚀 Rising Stars</span>
                    <span>💎 Diamond Hands</span>
                </div>
            </div>

            {/* Stats Overview */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/20">
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-purple-400">{entries.length}</div>
                            <div className="text-xs text-purple-200">Active Traders</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-blue-400">
                                {entries.reduce((sum, entry) => sum + (entry.followerCount || 0), 0)}
                            </div>
                            <div className="text-xs text-blue-200">Total Followers</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-green-400">
                                {formatCurrency(entries.reduce((sum, entry) => sum + (entry.volume || 0), 0))}
                            </div>
                            <div className="text-xs text-green-200">Total Volume</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leaderboard Entries */}
            <div className="space-y-3">
                {entries.map((entry, index) => {
                    const isFollowed = followed.has(entry.address.toLowerCase());
                    const pnlData = formatPnL(entry.pnl || 0)
                    const isTopThree = index < 3

                    return (
                        <Card
                            key={entry.address}
                            className={`
                transition-all duration-200 hover:scale-[1.02] hover:shadow-xl
                ${isTopThree ? "pulse-glow border-yellow-500/30" : "border-slate-600/30"}
                bg-slate-900/50 backdrop-blur-sm
              `}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    {/* Left Side - Rank & Address */}
                                    <div className="flex items-center gap-3">
                                        {/* Rank Badge */}
                                        <div
                                            className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        bg-gradient-to-br ${getRankColor(index)} text-white font-bold
                        ${isTopThree ? "shadow-lg" : ""}
                      `}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs">{getRankEmoji(index)}</span>
                                                <span className="text-xs font-bold">#{index + 1}</span>
                                            </div>
                                        </div>

                                        {/* Address & Basic Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {getRankIcon(index)}
                                                <code className="text-white font-mono text-sm">
                                                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <span className="text-blue-400 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {entry.score.toFixed(1)}
                                                </span>
                                                <span className="text-purple-400 flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {entry.followerCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Stats & Action */}
                                    <div className="text-right space-y-2">
                                        {/* PnL Badge */}
                                        <div
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pnlData.bgColor} ${pnlData.borderColor} border`}
                                        >
                                            <DollarSign className="w-3 h-3" />
                                            <span className={pnlData.color}>{pnlData.value}</span>
                                        </div>

                                        {/* Volume */}
                                        <div className="text-xs text-slate-400">
                                            Vol: <span className="text-slate-300 font-medium">{formatCurrency(entry.volume || 0)}</span>
                                        </div>

                                        {/* Follow Button */}
                                        {authenticated && walletsReady ? (
                                            <Button
                                                onClick={() => handleToggleFollow(entry.address)}
                                                disabled={following === entry.address || loadingFollows}
                                                variant={isTopThree ? "meme" : isFollowed ? "secondary" : "default"}
                                                size="sm"
                                                className="w-full"
                                            >
                                                {following === entry.address ? (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                        Loading...
                                                    </div>
                                                ) : isFollowed
                                                    ? (<><Users className="w-3 h-3 mr-1" />Unfollow</>)
                                                    : (<><Target className="w-3 h-3 mr-1" />Follow</>)}
                                            </Button>
                                        ) : (
                                            <Button disabled variant="outline" size="sm" className="w-full text-xs bg-transparent">
                                                <Wallet className="w-3 h-3 mr-1" />
                                                Connect Wallet
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Empty State */}
            {entries.length === 0 && (
                <Card className="bg-slate-800/30 border-slate-600/30">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="text-4xl">😭</div>
                        <h3 className="text-xl font-bold text-white">No Traders Yet</h3>
                        <p className="text-slate-400">Be the first to start trading and claim the crown!</p>
                        <Button variant="meme" className="mt-4">
                            Start Trading
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Footer Info */}
            <Card className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 border-slate-600/30">
                <CardContent className="p-4 text-center">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-white">🏆 Ranking System</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Rankings based on trading performance, consistency, and follower growth. Top performers get the crown and
                            maximum deportation power! 👑
                        </p>
                        <div className="flex justify-center gap-2 text-lg mt-3">
                            <span>👑</span>
                            <span>🚀</span>
                            <span>💎</span>
                            <span>🎯</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
