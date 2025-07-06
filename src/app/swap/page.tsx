"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Zap, AlertTriangle, CheckCircle, ExternalLink, Coins } from "lucide-react"
import { toast } from "sonner"
import { useSendTransaction, useSignTransaction } from "@privy-io/react-auth";
import { Contract, ethers, Interface, JsonRpcProvider, TransactionRequest } from "ethers";

import { usePrivyTelegram } from "@/hooks/usePrivyTelegram"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { POPULAR_TOKENS } from "@/constants/tokens";
import { populateForSend, toPrivyUnsigned } from "@/lib/tx";

const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const erc20Iface = new Interface([
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 value) returns (bool)"
]);

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

    const { authenticated, evmAddress, isConnecting, telegramUserId } = usePrivyTelegram({ autoConnect: true });
    const { signTransaction } = useSignTransaction();
    const { sendTransaction } = useSendTransaction();


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

            const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC);
            const erc20 = new Contract(
                swapState.fromToken.address,
                erc20Iface,
                provider
            );
            const allowance: bigint = await erc20.allowance(evmAddress, PANCAKE_ROUTER);

            if (allowance < BigInt(amountInWei)) {
                const approveTxReq: TransactionRequest = {
                    to: swapState.fromToken.address,
                    data: erc20Iface.encodeFunctionData("approve",
                        [PANCAKE_ROUTER, amountInWei]),
                    from: evmAddress,
                    value: "0x0"
                };
                const populatedApprove = await populateForSend(approveTxReq, provider);
                const privyApproveTx = toPrivyUnsigned(populatedApprove);
                const { hash } = await sendTransaction(privyApproveTx, {
                    uiOptions: { showWalletUIs: false, description: "Approve token" },
                    address: evmAddress,
                });

                toast.info(`Approved! Tx: ${hash}`);
            }

            // build unsigned tx
            const buildRes = await fetch("/api/defi/build-tx", {
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

            const { unsignedTxBase64, error: buildError, txParams } = await buildRes.json();
            if (!buildRes.ok || !unsignedTxBase64) throw new Error(buildError || "Build failed");

            const { signature } = await signTransaction(
                {
                    ...txParams,
                    gasLimit: txParams.gasLimit,
                    chainId: Number(txParams.chainId)
                },
                {
                    uiOptions: {
                        showWalletUIs: false,
                        description: "PancakeSwap token swap",
                        successHeader: "Swap successful!",
                        successDescription: "You deported the dip 🐸",
                    },
                    address: txParams.from,
                }
            );

            const sendRes = await fetch("/api/defi/send-tx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signed_tx_base64: Buffer.from(signature.slice(2), "hex").toString("base64"),
                }),
            });

            const { txHash, error: sendError } = await sendRes.json();
            if (!sendRes.ok || !txHash) throw new Error(sendError || "Send failed");

            await fetch(`${process.env.NEXT_PUBLIC_BOT_URL}/swap`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_user_id: telegramUserId,
                    status: "SUCCESS",
                    txHash
                })
            });

            fetch("/api/defi/copy-trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leader_address: evmAddress,
                    token_in: swapState.fromToken.address,
                    token_out: swapState.toToken.address,
                    amount_in_wei: amountInWei,
                    slippage_bps: Math.floor(parseFloat(swapState.slippage) * 100)
                })
            })
                .then((r) => r.json())
                .then(({ copied, results }) => {
                    if (copied > 0) {
                        toast.success(`Copied to ${copied} follower${copied > 1 ? "s" : ""}`);
                        console.table(results);   // optional: inspect txHashes in devtools
                    }
                })
                .catch(console.error);

            updateSwapState({
                txHash,
                isLoading: false,
                fromAmount: "",
                toAmount: "",
            });

            toast.success("Swap submitted! 🎉");
        } catch (error) {
            console.error("Swap failed:", error);
            await fetch(`${process.env.NEXT_PUBLIC_BOT_URL}/swap`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_user_id: telegramUserId,
                    status: "FAILED",
                    error: (error as Error).message
                })
            });


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
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">From</label>

                        {/* Token Selection */}
                        <div className="space-y-3">
                            <Select
                                value={swapState.fromToken?.symbol || ""}
                                onValueChange={(value) => {
                                    const token = POPULAR_TOKENS.find((t) => t.symbol === value)
                                    updateSwapState({ fromToken: token || null })
                                }}
                            >
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-14">
                                    <SelectValue placeholder="Select token">
                                        {swapState.fromToken && (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                >
                                                    <Coins className="w-4 h-4 ${swapState.fromToken.color" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold text-white">{swapState.fromToken.symbol}</span>
                                                    <span className="text-slate-400 text-xs">{swapState.fromToken.name}</span>
                                                </div>
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                                    {POPULAR_TOKENS.map((token) => (
                                        <SelectItem
                                            key={token.symbol}
                                            value={token.symbol}
                                            className="text-white hover:bg-slate-700 focus:bg-slate-700 py-3"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                >
                                                    <Coins className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                    <span className="font-semibold text-white text-sm">{token.symbol}</span>
                                                    <span className="text-slate-400 text-xs truncate w-full">{token.name}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Amount Input */}
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={swapState.fromAmount}
                                    onChange={(e) => updateSwapState({ fromAmount: e.target.value })}
                                    className="bg-slate-800/50 border-slate-600 text-white text-xl h-14 pr-16"
                                />
                                {swapState.fromToken && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <span className="text-sm font-medium">
                                            {swapState.fromToken.symbol}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleTokenSwap}
                            className="rounded-full bg-slate-700 hover:bg-slate-600 text-white w-12 h-12 transition-all hover:scale-110"
                        >
                            <ArrowUpDown className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">To</label>

                        {/* Token Selection */}
                        <div className="space-y-3">
                            <Select
                                value={swapState.toToken?.symbol || ""}
                                onValueChange={(value) => {
                                    const token = POPULAR_TOKENS.find((t) => t.symbol === value)
                                    updateSwapState({ toToken: token || null })
                                }}
                            >
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-14">
                                    <SelectValue placeholder="Select token">
                                        {swapState.toToken && (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center`}
                                                >
                                                    <Coins className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold text-white">{swapState.toToken.symbol}</span>
                                                    <span className="text-slate-400 text-xs">{swapState.toToken.name}</span>
                                                </div>
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                                    {POPULAR_TOKENS.filter((t) => t.symbol !== swapState.fromToken?.symbol).map((token) => (
                                        <SelectItem
                                            key={token.symbol}
                                            value={token.symbol}
                                            className="text-white hover:bg-slate-700 focus:bg-slate-700 py-3"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                >
                                                    <Coins className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                    <span className="font-semibold text-white text-sm">{token.symbol}</span>
                                                    <span className="text-slate-400 text-xs truncate w-full">{token.name}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Amount Output */}
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={swapState.toAmount}
                                    readOnly
                                    className="bg-slate-800/50 border-slate-600 text-white text-xl h-14 pr-20"
                                />
                                {swapState.toToken && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <span className="text-sm font-medium">{swapState.toToken.symbol}</span>
                                    </div>
                                )}
                                {swapState.isLoading && (
                                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Slippage Settings */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">Slippage Tolerance</label>
                        <div className="flex gap-2">
                            {["0.1", "0.5", "1.0"].map((value) => (
                                <Button
                                    key={value}
                                    variant={swapState.slippage === value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateSwapState({ slippage: value })}
                                    className="flex-1 bg-slate-800/50 border-slate-600 hover:bg-slate-700"
                                >
                                    {value}%
                                </Button>
                            ))}
                            <Input
                                type="number"
                                placeholder="Custom"
                                value={swapState.slippage}
                                onChange={(e) => updateSwapState({ slippage: e.target.value })}
                                className="w-24 bg-slate-800/50 border-slate-600 text-white text-center"
                                step="0.1"
                                min="0.1"
                                max="50"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {swapState.error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-red-400 text-sm">{swapState.error}</span>
                            </div>
                        </div>
                    )}

                    {/* Success Display */}
                    {swapState.txHash && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                <span className="text-green-400 text-sm flex-1">Transaction successful!</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`https://bscscan.com/tx/${swapState.txHash}`, "_blank")}
                                    className="p-2 h-auto hover:bg-green-500/10"
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
                        className="w-full text-lg py-6 mt-6"
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

            {/* Enhanced Info Card */}
            <Card className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 border-slate-600/30">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <Coins className="w-4 h-4 text-blue-400" />
                            Swap Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Network:</span>
                                    <span className="text-yellow-400 font-medium">BSC</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">DEX:</span>
                                    <span className="text-pink-400 font-medium">PancakeSwap</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Slippage:</span>
                                    <span className="text-blue-400 font-medium">{swapState.slippage}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Fee:</span>
                                    <span className="text-green-400 font-medium">0.25%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
