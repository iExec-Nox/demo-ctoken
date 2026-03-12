import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-anybody text-text-heading text-5xl font-bold">404</h1>
      <h2 className="font-anybody text-text-heading text-2xl font-bold">
        Page not found
      </h2>
      <p className="font-mulish text-text-muted max-w-md text-base">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover rounded-xl px-5 py-4 font-bold transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
