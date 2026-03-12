'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-text-heading text-3xl font-bold">
            Something went wrong
          </h1>
          <p className="text-text-muted max-w-md text-base">
            {error.message || 'A critical error occurred.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl px-5 py-4 font-bold transition-colors"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
