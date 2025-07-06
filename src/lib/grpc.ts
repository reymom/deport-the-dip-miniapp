// The code runs ONLY on the server (Node) — never import in client components.

import { credentials } from "@grpc/grpc-js";
import { TransactionServiceClient } from "@/generated/transaction";
import { SwapServiceClient } from "@/generated/pancake";

export function getTxGrpcClient() {
  if (typeof window !== "undefined") {
    throw new Error("getTxGrpcClient() should only be used on the server");
  }

  return new TransactionServiceClient(
    process.env.NEXT_PUBLIC_DEFI_GRPC_ENDPOINT!,
    credentials.createInsecure()
  );
}

export function getSwapGrpcClient() {
  if (typeof window !== "undefined") {
    throw new Error("getSwapGrpcClient() should only be used on the server");
  }

  return new SwapServiceClient(
    process.env.NEXT_PUBLIC_DEFI_GRPC_ENDPOINT!,
    credentials.createInsecure()
  );
}
