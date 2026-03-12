import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface CodeSectionProps {
  code: string;
}

export function CodeSection({ code }: CodeSectionProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="border-surface-border bg-surface flex w-full min-w-0 flex-col gap-4 rounded-2xl border px-5 py-3 backdrop-blur-sm md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            <span
              aria-hidden="true"
              className="material-icons text-primary-foreground text-[24px]!"
            >
              code
            </span>
          </div>
          <span className="font-mulish text-text-heading text-sm font-bold">
            Function called
          </span>
        </div>
        <button
          type="button"
          onClick={() => copy(code)}
          className="hover:bg-surface-border/50 flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors"
          aria-label="Copy code"
        >
          <span
            aria-hidden="true"
            className="material-icons text-text-muted text-[18px]! transition-colors"
          >
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>
      <pre className="text-code-text overflow-x-auto font-mono text-xs leading-[19.5px]">
        {code}
      </pre>
    </div>
  );
}
