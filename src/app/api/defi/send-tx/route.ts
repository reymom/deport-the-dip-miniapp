import { NextRequest, NextResponse } from "next/server";
import { getTxGrpcClient } from "@/lib/grpc";
import { SubmitTxRequest, SubmitTxResponse } from "@/generated/transaction";

export async function POST(req: NextRequest) {
  const { signed_tx_base64 } = await req.json();

  if (!signed_tx_base64) {
    return NextResponse.json(
      { error: "signed_tx_base64 required" },
      { status: 400 }
    );
  }

  try {
    const submitReq = SubmitTxRequest.create({
      signedTxBase64: signed_tx_base64,
      waitForConfirmation: false,
    });

    const res: SubmitTxResponse = await submitSignedTxAsync(submitReq);

    return NextResponse.json({
      txHash: res.txHash,
      explorerUrl: res.explorerUrl,
    });
  } catch (err) {
    console.error("[send-tx] error: ", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function submitSignedTxAsync(
  req: SubmitTxRequest
): Promise<SubmitTxResponse> {
  const client = getTxGrpcClient();
  return new Promise((resolve, reject) => {
    client.submitSignedTx(req, (err, res) => {
      if (err) return reject(err);
      if (!res) return reject(new Error("Empty gRPC response"));
      resolve(res);
    });
  });
}
