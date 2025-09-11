export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="text-5xl font-extrabold text-blue-700 mb-2 tracking-tight">BlueBank</div>
          <div className="text-lg text-blue-500 font-medium mb-2">Your modern digital banking experience</div>
          <div className="text-sm text-gray-400">Safe. Simple. Secure.</div>
        </div>
        <div className="flex flex-col gap-4 w-full mt-4">
          <a href="/login" className="w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition">Login</a>
          <a href="/register" className="w-full text-center py-3 rounded-xl bg-white border border-blue-600 hover:bg-blue-50 text-blue-700 font-semibold text-lg shadow transition">Register</a>
        </div>
        <div className="mt-10 text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} BlueBank. All rights reserved.
        </div>
      </div>
    </div>
  );
}
