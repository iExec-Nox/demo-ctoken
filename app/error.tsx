'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-anybody text-text-heading text-3xl font-bold">
        Something went wrong
      </h1>
      <p className="font-mulish text-text-muted max-w-md text-base">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover rounded-xl px-5 py-4 font-bold transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
