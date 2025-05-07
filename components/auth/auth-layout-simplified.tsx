import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayoutSimplified({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/abstract-letter-w.png"
              alt="Wellness Dashboard Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="text-xl font-bold text-gray-900">Wellness Dashboard</span>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">{children}</div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Wellness Dashboard. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
