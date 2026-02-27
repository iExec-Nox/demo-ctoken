"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-anybody text-3xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="max-w-md font-mulish text-base text-slate-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[#748eff] px-5 py-4 font-mulish font-bold text-white transition-colors hover:bg-[#6378e6]"
      >
        Try again
      </button>
    </main>
  );
}
