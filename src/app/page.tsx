import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Users, Zap, ArrowRight, Ship, Target } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="pulse-glow border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-orange-900/20">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🚢</div>
            <h2 className="text-2xl font-bold text-white">Join the Deportation Movement</h2>
            <p className="text-amber-200 leading-relaxed">
              Stop getting rekt by dips! Follow the whales, copy their trades, and deport your losses to the shadow
              realm.
            </p>
            <Link href="/connect">
              <Button variant="meme" size="lg" className="w-full">
                <Wallet className="w-5 h-5 mr-2" />
                Connect & Start Deporting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-blue-900/30 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Users className="w-5 h-5 text-blue-400" />
              Follow Top Traders
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-blue-200 text-sm">
              Discover and follow the most profitable wallets. Let the whales guide your trades.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-900/30 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Zap className="w-5 h-5 text-purple-400" />
              Auto Copy Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-purple-200 text-sm">
              Automatically mirror successful trades. Set it and forget it while profits roll in.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-pink-900/30 border-pink-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              Leaderboard Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-pink-200 text-sm">
              Track performance, compete with others, and climb the deportation leaderboard.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">1,337</div>
              <div className="text-xs text-green-200">Active Traders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">420%</div>
              <div className="text-xs text-green-200">Avg Returns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">69K</div>
              <div className="text-xs text-green-200">Dips Deported</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center gap-2 text-2xl">
            <Ship className="w-8 h-8 text-red-400" />
            <Target className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Ready to Deport Your Losses?</h3>
          <p className="text-red-200 text-sm">
            Join thousands of traders who have ve already shipped their dips to the shadow realm.
          </p>
          <Link href="/connect">
            <Button variant="meme" className="w-full">
              Start Your Deportation Journey
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-3 pt-4">
        <p className="text-xs text-slate-400">Deporting your worse trades 🤝</p>
        <div className="flex justify-center gap-2 text-lg">
          <span>💎</span>
          <span>🙌</span>
          <span>🚢</span>
          <span>🎯</span>
        </div>
        <p className="text-xs text-slate-500">@deport_the_dip_bot</p>
      </div>
    </div>
  )
}
