import { NextRequest, NextResponse } from "next/server";
import { ServiceError, status as GrpcStatus } from "@grpc/grpc-js";

import { getSwapGrpcClient } from "@/lib/grpc";
import { SwapRequest, SwapResponse } from "@/generated/pancake";
import { createClient } from "@supabase/supabase-js";

const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const botUrl = process.env.NEXT_PUBLIC_BOT_URL!;

export async function POST(req: NextRequest) {
  const { leader_address, token_in, token_out, amount_in_wei, slippage_bps } =
    await req.json();

  const lowerLeader = (leader_address as string).toLowerCase();

  /* 1 ─ fetch followers */
  const { data: followers } = await supa
    .from("followers")
    .select("follower_address")
    .eq("leader_address", lowerLeader);

  if (!followers?.length) {
    return NextResponse.json({ copied: 0, results: [] });
  }

  const results: {
    follower: string;
    txHash: string;
    status: string;
    error: string;
  }[] = [];

  /* 3 ─ loop followers */
  await Promise.all(
    followers.map(async ({ follower_address }) => {
      try {
        const { data: user } = await supa
          .from("users")
          .select("eth_wallet_id, telegram_user_id")
          .eq("eth_address", follower_address)
          .single();

        if (!user) return;

        const reqSwap: SwapRequest = SwapRequest.create({
          user: {
            address: follower_address,
            walletId: user.eth_wallet_id,
          },
          tokenIn: token_in,
          tokenOut: token_out,
          amountInWei: amount_in_wei,
          slippageBps: slippage_bps ?? 50,
        });

        const swapRes = await executeSwapAsync(reqSwap);

        results.push({
          follower: follower_address,
          txHash: swapRes.txHash,
          status: swapRes.status,
          error: swapRes.error,
        });

        // DM follower
        await fetch(`${botUrl}/swap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_user_id: user.telegram_user_id,
            status: swapRes.status,
            txHash: swapRes.txHash,
            error: swapRes.error,
          }),
        });
      } catch (e) {
        let http = 500;
        let msg = "Unknown error";

        if (isServiceError(e)) {
          msg = e.message || e.details || "gRPC error";
          if (
            e.code === GrpcStatus.INVALID_ARGUMENT ||
            e.code === GrpcStatus.NOT_FOUND ||
            e.code === GrpcStatus.FAILED_PRECONDITION
          )
            http = 400;
        } else if (e instanceof Error) {
          msg = e.message;
        }

        console.error("[build-tx] gRPC error:", e);
        return NextResponse.json({ error: msg }, { status: http });
      }
    })
  );

  return NextResponse.json({ copied: followers.length, results });
}

async function executeSwapAsync(swapReq: SwapRequest): Promise<SwapResponse> {
  const client = getSwapGrpcClient();

  return new Promise((resolve, reject) => {
    client.executeSwap(swapReq, (err, res) => {
      if (err) return reject(err);
      if (!res) return reject(new Error("Empty gRPC response"));
      resolve(res);
    });
  });
}

function isServiceError(e: unknown): e is ServiceError {
  return typeof e === "object" && e !== null && "code" in e;
}
