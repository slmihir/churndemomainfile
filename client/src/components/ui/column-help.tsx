import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ColumnHelp({ title, body, href }: { title: string; body: string; href?: string }) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Info: ${title}`}
            className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-foreground/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="sr-only">{title}</span>
            <i className="fas fa-question"></i>
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="max-w-xs">
          <p className="text-[11px] font-semibold mb-1">{title}</p>
          <p className="text-[12px] text-foreground/80">{body}</p>
          {href && (
            <a href={href} className="mt-1 inline-block text-[11px] text-primary underline">Learn more →</a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


