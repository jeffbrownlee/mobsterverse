export default function GamePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Game</h1>
        <p className="text-gray-600">
          Use the navigation menu on the left to access different areas of the game.
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h2>
        <p className="text-blue-800">
          Your game stats are displayed on the right. You can see your current location, 
          available turns, and money. Check back here for updates and announcements.
        </p>
      </div>
    </div>
  );
}
