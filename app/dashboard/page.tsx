export default function DashboardPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-20 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-[family-name:var(--font-anybody)] text-4xl font-bold text-white">
          Dashboard
        </h1>
        <p className="font-[family-name:var(--font-mulish)] text-sm text-slate-400">
          Your confidential portfolio will appear here.
        </p>
      </div>
    </main>
  );
}
