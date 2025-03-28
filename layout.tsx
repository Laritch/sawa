import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stressedabit Platform",
  description: "Integrated Expert Chat & Collaboration Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-zinc-900 text-white p-4">
            <div className="mb-8">
              <h1 className="text-xl font-bold mb-1">Stressedabit</h1>
              <p className="text-xs text-zinc-400">Expert Chat & Collaboration</p>
            </div>
            <nav className="space-y-1">
              <Link
                href="/"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Dashboard
              </Link>
              {/* Existing navigation links */}
              <Link
                href="/chat"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/whiteboard"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Whiteboard
              </Link>
              <Link
                href="/matchmaking"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Expert Matchmaking
              </Link>
              <Link
                href="/docs"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Collaborative Docs
              </Link>

              {/* Updated VIP Features Category */}
              <div className="mt-4 mb-2 px-2 text-xs font-medium text-zinc-400 uppercase">
                Premium Features
              </div>

              <Link
                href="/premium/mastermind"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Secret Mastermind
              </Link>
              <Link
                href="/premium/beta-access"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                First Access Program
              </Link>
              <Link
                href="/premium/swag"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                VIP Swag
              </Link>

              {/* New Engagement Features */}
              <div className="mt-4 mb-2 px-2 text-xs font-medium text-zinc-400 uppercase">
                Engagement
              </div>
              <Link
                href="/rewards/points"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Rewards & Points
              </Link>
              <Link
                href="/rewards/leaderboard"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/concierge"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                AI Concierge
              </Link>
              <Link
                href="/success-stories"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Success Stories
              </Link>

              <Link
                href="/profile/integration"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors bg-indigo-900 mt-1"
              >
                <span className="flex items-center">
                  <span>Activity Hub</span>
                  <span className="ml-auto px-1.5 py-0.5 text-xs bg-indigo-500 text-white rounded-full">New</span>
                </span>
              </Link>

              {/* Existing Expert Appreciation links */}
              <Link
                href="/gifting"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Expert Appreciation
              </Link>
              <Link
                href="/profile/gifts"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Gift Collection
              </Link>
              <Link
                href="/profile/achievements"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Progress & Achievements
              </Link>
              <Link
                href="/payments"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Payments
              </Link>
              <Link
                href="/admin"
                className="block p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                Admin Panel
              </Link>
            </nav>
            {/* User info at bottom */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-3 p-2 bg-zinc-800 rounded">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                  <span className="font-bold text-sm">JD</span>
                </div>
                <div>
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-zinc-400">Online</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-zinc-50">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
