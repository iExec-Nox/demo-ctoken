"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1d1d24] text-[#ededed] antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="max-w-md text-base text-slate-400">
            {error.message || "A critical error occurred."}
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-[#748eff] px-5 py-4 font-bold text-white transition-colors hover:bg-[#6378e6]"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
