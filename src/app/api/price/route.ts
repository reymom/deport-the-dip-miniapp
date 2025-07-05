import { NextResponse } from "next/server";
import { POPULAR_TOKENS } from "@/constants/tokens";

export async function GET() {
  const ids = POPULAR_TOKENS.map((t) => t.coingeckoId).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  const res = await fetch(url);
  const data = await res.json();

  const prices: Record<string, number> = {};
  for (const token of POPULAR_TOKENS) {
    const price = data[token.coingeckoId]?.usd;
    if (price) prices[token.symbol] = price;
  }

  return NextResponse.json(prices);
}
