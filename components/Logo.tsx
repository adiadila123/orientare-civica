interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-space-sm ${className ?? ''}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#1E3A8A" />
        <path d="M6 22L13 10L18 17L21 12L26 22Z" fill="#38BDF8" />
        <circle cx="21" cy="12" r="1.5" fill="#ffffff" />
        <path d="M6 22C10 19 18 19 26 22" stroke="#60A5FA" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="flex flex-col text-left">
        <span className="font-title-md text-title-md text-primary leading-tight tracking-tight">
          Unde merg?
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Orientare Civică
        </span>
      </span>
    </div>
  );
}
