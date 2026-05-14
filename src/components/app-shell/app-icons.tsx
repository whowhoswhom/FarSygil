import type { SVGProps } from "react";

export type AppIconName =
  | "dashboard"
  | "runs"
  | "health"
  | "load"
  | "connect"
  | "settings"
  | "distance"
  | "time"
  | "pace"
  | "elevation"
  | "cadence"
  | "heartrate"
  | "recovery"
  | "run"
  | "arrow-right"
  | "arrow-left"
  | "spark"
  | "source";

interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName;
}

export function AppLogoMark({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 72 48"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M7 10H34L27 19H0L7 10Z"
        fill="url(#farsygil-mark-top)"
      />
      <path
        d="M22 23H49L42 32H15L22 23Z"
        fill="url(#farsygil-mark-bottom)"
      />
      <defs>
        <linearGradient id="farsygil-mark-top" x1="0" y1="10" x2="34" y2="19">
          <stop stopColor="#C6FF63" />
          <stop offset="1" stopColor="#84E62F" />
        </linearGradient>
        <linearGradient id="farsygil-mark-bottom" x1="15" y1="23" x2="49" y2="32">
          <stop stopColor="#A7F43D" />
          <stop offset="1" stopColor="#6BC122" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AppIcon({ name, className = "", ...props }: AppIconProps) {
  const iconClassName = `h-[1em] w-[1em] ${className}`.trim();

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "runs":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M6 16L9 11L12.5 12.5L15.5 8L18 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 7.5A1.75 1.75 0 108.5 4a1.75 1.75 0 000 3.5z" fill="currentColor" />
          <path d="M4 20H20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case "health":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M12 20.2L10.6 18.95C6.1 14.92 3 12.1 3 8.63A4.63 4.63 0 017.63 4c1.7 0 3.33.8 4.37 2.07A5.65 5.65 0 0116.37 4 4.63 4.63 0 0121 8.63c0 3.47-3.1 6.29-7.6 10.3L12 20.2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "load":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M3 13H6L8.5 8L11.5 17L14 11L16.5 14H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "connect":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M8.5 8.5L6.4 10.6a3 3 0 000 4.24 3 3 0 004.24 0l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15.5 15.5l2.1-2.1a3 3 0 000-4.24 3 3 0 00-4.24 0l-2.12 2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M12 15.25A3.25 3.25 0 1012 8.75a3.25 3.25 0 000 6.5z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.1 13.1l1.55-1.1-1.3-2.24-1.88.34a6.98 6.98 0 00-1.23-.72L15.9 7.5l-2.6-.01-.34 1.88c-.44.16-.86.39-1.26.67l-1.84-.34-1.33 2.23 1.52 1.1c-.03.24-.05.49-.05.74 0 .27.02.53.05.79l-1.52 1.07 1.31 2.26 1.86-.34c.39.29.82.52 1.27.69l.35 1.9h2.59l.34-1.9c.44-.17.86-.39 1.25-.68l1.88.33 1.3-2.25-1.55-1.08c.04-.26.06-.53.06-.8 0-.25-.02-.5-.06-.75z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "distance":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M6 6h12M9 12h6M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "time":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5V12l3.2 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "pace":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M6 16.5a7 7 0 1112 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 12l3.5-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.25" fill="currentColor" />
        </svg>
      );
    case "elevation":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M4 18l5.1-7.2L12.4 15l2.6-3.5L20 18H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "cadence":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M8 5.5C6.34 5.5 5 6.84 5 8.5S6.34 11.5 8 11.5 11 10.16 11 8.5 9.66 5.5 8 5.5zm8 7C14.34 12.5 13 13.84 13 15.5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "heartrate":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M3 12h3l2-4 3 9 2-5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "recovery":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M12 4a8 8 0 108 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 4h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "run":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <circle cx="13.5" cy="5.5" r="1.75" fill="currentColor" />
          <path d="M10 10.5l2.8-2.5 2.4 1.5M8 16l3-3 2 1.2L15 20M10 10.5L7 14m6-2.5l4 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M8 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M16 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "source":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true" {...props}>
          <path d="M12 3l2.5 5.2L20 9l-4 3.9.9 5.5L12 15.8 7.1 18.4 8 12.9 4 9l5.5-.8L12 3z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}
