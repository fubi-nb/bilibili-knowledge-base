import Link from "next/link";

export default function Nav() {
  return (
    <nav className="px-4 py-3 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <Link href="/" className="font-semibold">B站知识库</Link>
        <div className="flex-1" />
        <Link href="/library" className="px-3 py-1.5 rounded-md text-white btn-gradient brand ripple shadow-soft">知识库</Link>
      </div>
    </nav>
  );
}
