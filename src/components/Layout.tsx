import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-mobile py-4 fade-in">
        <Outlet />
      </main>
      <footer className="border-t border-border px-mobile py-3 text-xs text-muted-foreground text-center">
        Alex V8 Trading Dashboard — Built with precision
      </footer>
    </div>
  );
}
