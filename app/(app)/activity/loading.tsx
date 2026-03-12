export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-surface-border border-t-primary h-10 w-10 animate-spin rounded-full border-4 motion-reduce:animate-none" />
        <p className="font-mulish text-text-muted text-sm">
          Loading activity...
        </p>
      </div>
    </div>
  );
}
