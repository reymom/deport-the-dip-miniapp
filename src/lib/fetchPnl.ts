import { gql } from "urql";
import { graphClient } from "./graphClient";

const SWAPS_QUERY = gql`
  query UserSwaps($sender: Bytes!) {
    swaps(
      where: { sender: $sender }
      first: 1000
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amountUSD
      amount0In
      amount1In
      amount0Out
      amount1Out
      timestamp
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
    }
  }
`;

export async function fetchUserPnl(
  address: string
): Promise<{ volume: number; pnl: number }> {
  const { data, error } = await graphClient
    .query(SWAPS_QUERY, { sender: address.toLowerCase() })
    .toPromise();

  if (error || !data?.swaps) {
    console.error("Graph fetch failed", error);
    return { volume: 0, pnl: 0 };
  }

  let totalVolume = 0;
  let totalPnL = 0;

  for (const swap of data.swaps) {
    const amountIn =
      parseFloat(swap.amount0In || "0") + parseFloat(swap.amount1In || "0");
    const amountOut =
      parseFloat(swap.amount0Out || "0") + parseFloat(swap.amount1Out || "0");
    const amountUSD = parseFloat(swap.amountUSD || "0");

    totalVolume += amountUSD;
    totalPnL += amountOut - amountIn;
  }

  return { volume: totalVolume, pnl: totalPnL };
}
