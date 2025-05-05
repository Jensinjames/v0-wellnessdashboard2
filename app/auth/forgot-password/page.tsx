export default function ForgotPasswordPage() {
  return (
    <div className="container py-6 max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        <p className="mb-4">Please enter your email to reset your password.</p>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="your@email.com"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Send Reset Link
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/auth/sign-in" className="text-blue-600 hover:underline">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
