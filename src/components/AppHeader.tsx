import Image from "next/image"
import Link from "next/link"

export default function AppHeader() {
    return (
        <div className="text-center space-y-4 mb-8">
            <Link href="/" className="inline-block">
                <div className="relative inline-block">
                    <Image
                        src="/deport-the-dip.png"
                        alt="Deport The Dip"
                        width={100}
                        height={100}
                        className="float-animation mx-auto"
                    />
                    <div className="absolute -top-2 -right-2 text-xl tears-animation">💧</div>
                    <div className="absolute -top-4 right-4 text-lg tears-animation" style={{ animationDelay: "0.5s" }}>
                        💧
                    </div>
                </div>
            </Link>

            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg meme-text">DEPORT THE DIP</h1>
                <p className="text-blue-200 font-medium text-sm">Deport risk • Follow whales • Copy trades 🚀</p>
            </div>
        </div>
    )
}
