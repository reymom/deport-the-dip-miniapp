interface LinkedAccount {
  type: string;
  chain_type?: string;
  address?: string;
}

interface PrivyUser {
  id: string;
  linked_accounts: LinkedAccount[];
}

export interface UserResult {
  did: string;
  ethAddress?: string;
}

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;

export async function fetchPrivyUsers(): Promise<UserResult[]> {
  const authHeader = Buffer.from(
    `${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.privy.io/v1/users?limit=100", {
    headers: {
      Authorization: `Basic ${authHeader}`,
      "privy-app-id": PRIVY_APP_ID,
    },
  });

  const json = await res.json();

  const users: PrivyUser[] = json.data;

  return users
    .map((user) => {
      const ethWallet = user.linked_accounts.find(
        (acc) => acc.type === "wallet" && acc.chain_type === "ethereum"
      );
      return {
        did: user.id,
        ethAddress: ethWallet?.address?.toLowerCase(),
      };
    })
    .filter((u): u is Required<UserResult> => !!u.ethAddress);
}
