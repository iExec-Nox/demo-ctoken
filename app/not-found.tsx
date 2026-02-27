import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-anybody text-5xl font-bold text-white">404</h1>
      <h2 className="font-anybody text-2xl font-bold text-white">
        Page not found
      </h2>
      <p className="max-w-md font-mulish text-base text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-[#748eff] px-5 py-4 font-mulish font-bold text-white transition-colors hover:bg-[#6378e6]"
      >
        Back to home
      </Link>
    </main>
  );
}
