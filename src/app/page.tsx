import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Image
            src="/deport-the-dip.png"
            alt="Deport The Dip Mascot"
            width={120}
            height={120}
            className="float-animation mx-auto"
          />
          <div className="absolute -top-2 -right-2 text-2xl tears-animation">💧</div>
          <div className="absolute -top-4 right-4 text-xl tears-animation" style={{ animationDelay: "0.5s" }}>
            💧
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text meme-text">DEPORT THE DIP</h1>
          <p className="text-lg text-blue-200 font-medium">{"Unite in memecoin trading risk 🚀"}</p>
          <p className="text-sm text-slate-400">Follow leaders • Copy trades • Ship the dip</p>
        </div>
      </div>

      {/* Main connection card */}
      <Card className="pulse-glow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Wallet className="w-6 h-6 text-blue-400" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>Join the exodus and follow top traders</CardDescription>
        </CardHeader>
      </Card>

      {/* Footer meme text */}
      <div className="text-center space-y-2">
        <p className="text-xs text-slate-500">{'"In crypto we trust, in tears we bond" 🤝'}</p>
        <div className="flex justify-center gap-1 text-lg">
          <span>💎</span>
          <span>🙌</span>
          <span>😭</span>
          <span>🚢</span>
        </div>
      </div>
    </div>
  );
}
