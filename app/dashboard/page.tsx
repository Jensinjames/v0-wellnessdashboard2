export default function DashboardPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Wellness Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Activity Summary</h2>
          <p>Your activity summary will appear here.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Wellness Score</h2>
          <p>Your wellness score will appear here.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Goals Progress</h2>
          <p>Your goals progress will appear here.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-3">Recent Activities</h2>
        <p>Your recent activities will appear here.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Wellness Trends</h2>
        <p>Your wellness trends will appear here.</p>
      </div>
    </div>
  )
}
