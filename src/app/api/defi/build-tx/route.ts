import { ServiceError, status as GrpcStatus } from "@grpc/grpc-js";
import { NextRequest, NextResponse } from "next/server";

import { getGrpcClient } from "@/lib/grpc";
import {
  BuildTxRequest,
  BuildTxResponse,
  PancakePayload,
} from "@/generated/transaction";

export async function POST(req: NextRequest) {
  try {
    const { user_address, token_in, token_out, amount_in_wei, slippage_bps } =
      await req.json();

    const pancake = PancakePayload.create({
      tokenIn: token_in,
      tokenOut: token_out,
      amountInWei: amount_in_wei,
      slippageBps: slippage_bps ?? 50,
    });
    const buildReq = BuildTxRequest.create({
      userAddress: user_address,
      pancake,
    });
    const { unsignedTxBase64, txInfo } = await buildUnsignedTxAsync(buildReq);

    return NextResponse.json({ unsignedTxBase64, txInfo });
  } catch (e: unknown) {
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
}

async function buildUnsignedTxAsync(
  buildReq: BuildTxRequest
): Promise<BuildTxResponse> {
  const client = getGrpcClient();

  return new Promise((resolve, reject) => {
    client.buildUnsignedTx(buildReq, (err, res) => {
      if (err) return reject(err);
      if (!res) return reject(new Error("Empty gRPC response"));
      resolve(res);
    });
  });
}

function isServiceError(e: unknown): e is ServiceError {
  return typeof e === "object" && e !== null && "code" in e;
}
