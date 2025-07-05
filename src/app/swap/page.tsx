"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Zap, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useSignTransaction } from "@privy-io/react-auth";
import { ethers } from "ethers";

import { usePrivyTelegram } from "@/hooks/usePrivyTelegram"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { POPULAR_TOKENS } from "@/constants/tokens";
import Image from "next/image";

interface SwapState {
    fromToken: (typeof POPULAR_TOKENS)[0] | null
    toToken: (typeof POPULAR_TOKENS)[0] | null
    fromAmount: string
    toAmount: string
    slippage: string
    isLoading: boolean
    txHash: string | null
    error: string | null
}

export default function Page() {
    console.log("🔁 Rendering SwapPage");

    useEffect(() => {
        console.log("⚡ useEffect triggered");
    }, []);

    const [swapState, setSwapState] = useState<SwapState>({
        fromToken: POPULAR_TOKENS[0],
        toToken: null,
        fromAmount: "",
        toAmount: "",
        slippage: "0.5",
        isLoading: false,
        txHash: null,
        error: null,
    })

    const { authenticated, evmAddress, isConnecting } = usePrivyTelegram({ autoConnect: true });
    const { signTransaction } = useSignTransaction();

    useEffect(() => {
        const fetchQuote = async () => {
            if (
                swapState.fromToken &&
                swapState.toToken &&
                swapState.fromAmount &&
                parseFloat(swapState.fromAmount) > 0
            ) {
                try {
                    const amountInWei = ethers.parseUnits(
                        swapState.fromAmount,
                        swapState.fromToken.decimals
                    ).toString();
                    const quote = await getQuote(
                        swapState.fromToken.address,
                        swapState.toToken.address,
                        amountInWei
                    );
                    setSwapState((prev) => ({
                        ...prev,
                        toAmount: ethers.formatUnits(
                            quote.amountOut,
                            swapState.toToken!.decimals
                        ),
                    }));
                } catch (e) {
                    console.error("Quote error", e);
                    setSwapState((prev) => ({ ...prev, toAmount: "" }));
                }
            }
        };

        fetchQuote();
    }, [swapState.fromAmount, swapState.fromToken, swapState.toToken]);

    useEffect(() => {
        if (swapState.fromToken && swapState.toToken && swapState.fromAmount) {
            fetch("/api/price")
                .then((res) => res.json())
                .then((priceMap) => {
                    const fromPrice = priceMap[swapState.fromToken!.symbol];
                    const toPrice = priceMap[swapState.toToken!.symbol];

                    if (fromPrice && toPrice) {
                        const usdValue = parseFloat(swapState.fromAmount) * fromPrice;
                        const estToAmount = usdValue / toPrice;

                        updateSwapState({ toAmount: estToAmount.toFixed(6) });
                    }
                });
        }
    }, [swapState.fromAmount, swapState.fromToken, swapState.toToken]);

    // Reset error when inputs change
    useEffect(() => {
        if (swapState.error) {
            setSwapState((prev) => ({ ...prev, error: null }))
        }
    }, [swapState.fromAmount, swapState.fromToken, swapState.toToken, swapState.error])

    const updateSwapState = (updates: Partial<SwapState>) => {
        setSwapState((prev) => ({ ...prev, ...updates }))
    }

    const handleTokenSwap = () => {
        setSwapState((prev) => ({
            ...prev,
            fromToken: prev.toToken,
            toToken: prev.fromToken,
            fromAmount: prev.toAmount,
            toAmount: prev.fromAmount,
        }))
    }

    async function getQuote(tokenIn: string, tokenOut: string, amountIn: string) {
        const url = new URL("https://router.pancakeswap.finance/v3/quote");
        url.searchParams.append("tokenIn", tokenIn);
        url.searchParams.append("tokenOut", tokenOut);
        url.searchParams.append("amountIn", amountIn);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Quote fetch failed");
        return await res.json();
    }

    const executeSwap = async () => {
        if (
            !authenticated ||
            !evmAddress ||
            !swapState.fromToken ||
            !swapState.toToken ||
            !swapState.fromAmount
        ) {
            toast.error("Please complete all fields and connect your wallet");
            return;
        }

        try {
            updateSwapState({ isLoading: true, error: null, txHash: null });

            const decimals = swapState.fromToken.decimals;
            const amountInWei = ethers.parseUnits(swapState.fromAmount, decimals).toString();

            // Step 1: build unsigned tx
            const buildRes = await fetch("/api/swap/build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_address: evmAddress,
                    token_in: swapState.fromToken.address,
                    token_out: swapState.toToken.address,
                    amount_in_wei: amountInWei,
                    slippage_bps: Math.floor(parseFloat(swapState.slippage) * 100), // 0.5 → 50
                }),
            });

            const { unsignedTxBase64, error: buildError } = await buildRes.json();
            if (!buildRes.ok || !unsignedTxBase64) throw new Error(buildError || "Build failed");

            const unsignedTxHex = `0x${Buffer.from(unsignedTxBase64, "base64").toString("hex")}`;
            const unsignedTx = ethers.Transaction.from(unsignedTxHex);

            const { signature } = await signTransaction(
                {
                    to: unsignedTx.to!,
                    data: unsignedTx.data,
                    from: unsignedTx.from!,
                    gasLimit: unsignedTx.gasLimit?.toString(),
                    value: unsignedTx.value?.toString(),
                    nonce: unsignedTx.nonce?.toString(),
                    chainId: Number(unsignedTx.chainId),
                    maxFeePerGas: unsignedTx.maxFeePerGas?.toString(),
                    maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas?.toString(),
                    type: unsignedTx.type ?? undefined,
                },
                {
                    uiOptions: {
                        showWalletUIs: false,
                        description: "PancakeSwap token swap",
                        successHeader: "Swap successful!",
                        successDescription: "You deported the dip 🐸",
                    },
                    address: unsignedTx.from!,
                }
            );

            // Step 3: serialize & send
            const serializedTx = ethers.Transaction.from({
                ...unsignedTx,
                signature,
            }).serialized;

            const sendRes = await fetch("/api/swap/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signed_tx_base64: Buffer.from(serializedTx).toString("base64"),
                }),
            });

            const { txHash, error: sendError } = await sendRes.json();
            if (!sendRes.ok || !txHash) throw new Error(sendError || "Send failed");

            updateSwapState({
                txHash,
                isLoading: false,
                fromAmount: "",
                toAmount: "",
            });

            toast.success("Swap submitted! 🎉");
        } catch (error) {
            console.error("Swap failed:", error);
            updateSwapState({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
            toast.error("Swap failed!");
        }
    };

    if (!authenticated) {
        return (
            <div className="space-y-6">
                <Card className="pulse-glow">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
                        <h2 className="text-xl font-bold text-white">Wallet Not Connected</h2>
                        <p className="text-slate-300">Please connect your wallet to start swapping tokens.</p>
                        <Button variant="meme" disabled={isConnecting} className="w-full">
                            {isConnecting ? "Connecting..." : "Go to Connect Page"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Swap Card */}
            <Card className="pulse-glow">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl text-white">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        Deport Swap
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* From Token */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">From</label>
                        <div className="space-y-3">
                            <Select
                                value={swapState.fromToken?.symbol || ""}
                                onValueChange={(value) => {
                                    const token = POPULAR_TOKENS.find((t) => t.symbol === value)
                                    updateSwapState({ fromToken: token || null })
                                }}
                            >
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue placeholder="Select token" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                    {POPULAR_TOKENS.map((token) => (
                                        <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-slate-700">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={token.logo}
                                                    alt={`${token.symbol} logo`}
                                                    width={5}
                                                    height={5}
                                                    className="w-5 h-5 rounded-full border border-slate-600"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{token.symbol}</span>
                                                    <span className="text-slate-400 text-xs">{token.name}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                placeholder="0.0"
                                value={swapState.fromAmount}
                                onChange={(e) => updateSwapState({ fromAmount: e.target.value })}
                                className="bg-slate-800/50 border-slate-600 text-white text-lg h-12"
                            />
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleTokenSwap}
                            className="rounded-full bg-slate-700 hover:bg-slate-600 text-white"
                        >
                            <ArrowUpDown className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">To</label>
                        <div className="space-y-3">
                            <Select
                                value={swapState.toToken?.symbol || ""}
                                onValueChange={(value) => {
                                    const token = POPULAR_TOKENS.find((t) => t.symbol === value)
                                    updateSwapState({ toToken: token || null })
                                }}
                            >
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue placeholder="Select token" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                    {POPULAR_TOKENS.filter((t) => t.symbol !== swapState.fromToken?.symbol).map((token) => (
                                        <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{token.symbol}</span>
                                                <span className="text-slate-400 text-sm">{token.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={swapState.toAmount}
                                    readOnly
                                    className="bg-slate-800/50 border-slate-600 text-white text-lg h-12 pr-20"
                                />
                                {swapState.isLoading && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Slippage Settings */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Slippage Tolerance</label>
                        <div className="flex gap-2">
                            {["0.1", "0.5", "1.0"].map((value) => (
                                <Button
                                    key={value}
                                    variant={swapState.slippage === value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateSwapState({ slippage: value })}
                                    className="flex-1"
                                >
                                    {value}%
                                </Button>
                            ))}
                            <Input
                                type="number"
                                placeholder="Custom"
                                value={swapState.slippage}
                                onChange={(e) => updateSwapState({ slippage: e.target.value })}
                                className="w-20 bg-slate-800/50 border-slate-600 text-white text-center"
                                step="0.1"
                                min="0.1"
                                max="50"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {swapState.error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm">{swapState.error}</span>
                            </div>
                        </div>
                    )}

                    {/* Success Display */}
                    {swapState.txHash && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm">Transaction successful!</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`https://bscscan.com/tx/${swapState.txHash}`, "_blank")}
                                    className="ml-auto p-1 h-auto"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Swap Button */}
                    <Button
                        onClick={executeSwap}
                        disabled={
                            swapState.isLoading ||
                            !swapState.fromToken ||
                            !swapState.toToken ||
                            !swapState.fromAmount ||
                            !swapState.toAmount ||
                            swapState.fromToken.symbol === swapState.toToken.symbol
                        }
                        variant="meme"
                        size="lg"
                        className="w-full text-lg py-6"
                    >
                        {swapState.isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing Swap...
                            </div>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-2" />
                                Deport the Dip!
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <h3 className="font-medium text-white">Swap Info</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                            <div className="flex justify-between">
                                <span>Network:</span>
                                <span className="text-yellow-400">BNB Smart Chain</span>
                            </div>
                            <div className="flex justify-between">
                                <span>DEX:</span>
                                <span className="text-pink-400">PancakeSwap V3</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Slippage:</span>
                                <span className="text-blue-400">{swapState.slippage}%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
