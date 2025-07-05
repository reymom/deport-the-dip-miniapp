"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Wallet, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { usePrivyTelegram } from "@/hooks/usePrivyTelegram"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface WalletConnectProps {
    action?: string | null
}

function WalletConnect({ }: WalletConnectProps = {}) {
    const [isMounted, setIsMounted] = useState(false)
    const [dataSent, setDataSent] = useState(false)
    const apiCallInProgress = useRef(false)

    const {
        isWebAppReady,
        telegramUserId,
        privyId,
        evmAddress,
        delegated,
        ethWalletId,
        isConnecting,
        authenticated,
        walletsReady,
        connectWallet,
        disconnectWallet,
    } = usePrivyTelegram({ autoConnect: true })

    const apiUrl = process.env.NEXT_PUBLIC_BOT_URL

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const sendWalletDataToAPI = useCallback(async () => {
        if (!isWebAppReady || !telegramUserId || !evmAddress || dataSent || apiCallInProgress.current) return

        apiCallInProgress.current = true
        try {
            const response = await fetch(`${apiUrl}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_user_id: telegramUserId,
                    privy_did: privyId,
                    eth_wallet_id: ethWalletId,
                    eth_address: evmAddress,
                    eth_delegated: delegated,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }

            setDataSent(true)
            toast.success("Wallet successfully connected 🎉")
        } catch (error) {
            console.error("API Error:", error)
            toast.error("Failed to send wallet data")
        } finally {
            apiCallInProgress.current = false
        }
    }, [isWebAppReady, telegramUserId, evmAddress, delegated, privyId, ethWalletId, apiUrl, dataSent])

    useEffect(() => {
        if (authenticated && walletsReady && evmAddress && !dataSent) {
            sendWalletDataToAPI()
        }
    }, [authenticated, walletsReady, evmAddress, sendWalletDataToAPI, dataSent])

    const copyAddress = async () => {
        if (evmAddress) {
            try {
                await navigator.clipboard.writeText(evmAddress)
                toast.success("Address copied to clipboard! 📋")
            } catch (error) {
                toast.error(`Failed to copy address: ${error}`)
            }
        }
    }

    if (!isMounted) return null

    return (
        <div className="space-y-6">
            {/* Connection Status Card */}
            <Card className="pulse-glow">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl text-white">
                        <Wallet className="w-6 h-6 text-blue-400" />
                        Connect Wallet
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                        Join the movement and get access to the leaderboard
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {!authenticated ? (
                        <div className="space-y-4">
                            {/* Connection Steps */}
                            <div className="grid grid-cols-3 gap-3 text-center mb-6">
                                <div className="space-y-2">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-blue-400 font-bold">1</span>
                                    </div>
                                    <p className="text-xs text-slate-300">Connect</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-purple-400 font-bold">2</span>
                                    </div>
                                    <p className="text-xs text-slate-300">Follow</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-pink-400 font-bold">3</span>
                                    </div>
                                    <p className="text-xs text-slate-300">Profit</p>
                                </div>
                            </div>

                            <Button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                variant="meme"
                                size="lg"
                                className="w-full text-lg py-6"
                            >
                                {isConnecting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Connecting Wallet...
                                    </div>
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5 mr-2" />
                                        Connect Your Wallet
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Success Status */}
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400 font-medium">Wallet Connected Successfully!</span>
                                </div>

                                {evmAddress && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2">Your Wallet Address:</p>
                                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                                                <code className="text-sm text-blue-300 flex-1 truncate font-mono">{evmAddress}</code>
                                                <Button
                                                    onClick={copyAddress}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-slate-700"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {dataSent && (
                                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Registered with Deport The Dip Bot</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent border-slate-600 text-white hover:bg-slate-800"
                                >
                                    View Leaderboard
                                </Button>
                                <Button onClick={disconnectWallet} variant="destructive" className="w-full">
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Status Indicator */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full text-sm">
                            <div
                                className={`w-2 h-2 rounded-full ${authenticated ? "bg-green-400" : isConnecting ? "bg-yellow-400 animate-pulse" : "bg-slate-400"
                                    }`}
                            />
                            <span className="text-slate-300">
                                {authenticated ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-white">Ready to Deport?</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Once connected, you can follow top traders and automatically copy their winning trades. Your losses will
                                be deported to the shadow realm! 🚢
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function Page() {
    return <WalletConnect />;
}