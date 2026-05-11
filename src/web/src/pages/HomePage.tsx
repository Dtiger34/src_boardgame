import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-950 text-gray-100">
      <h1 className="text-5xl font-bold">
        Board<span className="text-amber-400">Game</span> Online
      </h1>
      <p className="text-gray-400 text-lg">Chơi cờ caro, cờ vua và nhiều trò chơi khác</p>
      <div className="flex gap-4">
        <Link to="/login" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors">
          Đăng nhập
        </Link>
        <Link to="/register" className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors">
          Đăng ký
        </Link>
      </div>
    </main>
  );
}
