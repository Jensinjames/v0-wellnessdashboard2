import Link from "next/link"
import { UserNav } from "./user-nav"

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            Wellness Dashboard
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/categories" className="text-sm font-medium hover:underline">
              Categories
            </Link>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
        <UserNav />
      </div>
    </header>
  )
}
