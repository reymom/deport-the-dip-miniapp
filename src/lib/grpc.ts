// The code runs ONLY on the server (Node) — never import in client components.

import { credentials } from "@grpc/grpc-js";
import { TransactionServiceClient } from "@/generated/transaction";

export function getGrpcClient() {
  if (typeof window !== "undefined") {
    throw new Error("getGrpcClient() should only be used on the server");
  }

  return new TransactionServiceClient(
    process.env.NEXT_PUBLIC_DEFI_GRPC_ENDPOINT!,
    credentials.createInsecure()
  );
}
