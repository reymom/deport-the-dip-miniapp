import { createClient } from "urql";
import { cacheExchange, fetchExchange } from "@urql/core";

export const graphClient = createClient({
  url: "https://gateway.thegraph.com/api/subgraphs/id/Aj9TDh9SPcn7cz4DXW26ga22VnBzHhPVuKGmE4YBzDFj",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${process.env.GRAPH_KEY}`,
    },
  },
});
