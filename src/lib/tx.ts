import {
  JsonRpcProvider,
  TransactionRequest,
  FeeData,
  getAddress,
  toBeHex,
} from "ethers";
import { UnsignedTransactionRequest } from "@privy-io/react-auth";

/**
 * Fills nonce, gas, and fee fields so a TransactionRequest is ready to sign.
 * Does not modify the original object; returns a fully-typed copy.
 */
export async function populateForSend(
  tx: TransactionRequest,
  provider: JsonRpcProvider
): Promise<TransactionRequest> {
  const filled: TransactionRequest = { ...tx };

  /* nonce ---------------------------------------------------------- */
  if (filled.nonce == null) {
    filled.nonce = await provider.getTransactionCount(
      filled.from as string,
      "pending"
    );
  }

  /* gas limit ------------------------------------------------------ */
  if (filled.gasLimit == null) {
    filled.gasLimit = await provider.estimateGas(filled);
  }

  /* fees ----------------------------------------------------------- */
  const fee: FeeData = await provider.getFeeData();
  if (fee.maxFeePerGas == null) {
    // BSC legacy-style
    filled.gasPrice = fee.gasPrice!;
    filled.type = 0;
  } else {
    // 1559 chains
    filled.maxFeePerGas = fee.maxFeePerGas!;
    filled.maxPriorityFeePerGas = fee.maxPriorityFeePerGas!;
    filled.type = 2;
  }

  /* chainId -------------------------------------------------------- */
  if (filled.chainId == null) {
    filled.chainId = (await provider.getNetwork()).chainId;
  }

  return filled;
}

type Quantity = string | number | bigint;

/** bigint → 0x-hex ; number|string pass through */
function toQuantity(v: bigint | number | string): Quantity {
  return typeof v === "bigint" ? toBeHex(v) : v;
}

export function toPrivyUnsigned(
  tx: TransactionRequest
): UnsignedTransactionRequest {
  const out: UnsignedTransactionRequest = {};

  /* from / to (hex strings) */
  if (tx.from) out.from = getAddress(tx.from as string);
  if (tx.to) out.to = getAddress(tx.to as string);

  /* numeric-like fields — include only when not null/undefined */
  if (tx.value != null) out.value = toQuantity(tx.value);
  if (tx.gasLimit != null) out.gasLimit = toQuantity(tx.gasLimit);
  if (tx.gasPrice != null) out.gasPrice = toQuantity(tx.gasPrice);
  if (tx.maxFeePerGas != null) out.maxFeePerGas = toQuantity(tx.maxFeePerGas);
  if (tx.maxPriorityFeePerGas != null)
    out.maxPriorityFeePerGas = toQuantity(tx.maxPriorityFeePerGas);
  if (tx.nonce != null) out.nonce = toQuantity(tx.nonce);

  /* misc */
  if (tx.data !== null) out.data = tx.data;
  if (tx.type !== undefined) out.type = Number(tx.type);
  if (tx.chainId !== undefined) out.chainId = Number(tx.chainId);

  return out;
}
