/* GET  /api/follows?addr=0x…       → ["0xleader1", "0xleader2"]
 * POST /api/follows                → body { follower, leader }
 * DELETE /api/follows              → body { follower, leader }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(req: NextRequest) {
  const follower = req.nextUrl.searchParams.get("addr")?.toLowerCase();
  if (!follower)
    return NextResponse.json({ error: "addr required" }, { status: 400 });

  const { data, error } = await supabase
    .from("followers")
    .select("leader_address")
    .eq("follower_address", follower);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r) => r.leader_address));
}
