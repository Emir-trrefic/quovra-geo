const PATHS = {
  scan: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /><path d="M8.5 11.2l1.8 1.8 3.2-3.6" /></>,
  fix: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 12v5M9.5 14.5h5" /></>,
  probe: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 15l3-4 3 2 4-6" /><circle cx="18" cy="7" r="1.2" /></>,
  ci: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9.5l3 2.5-3 2.5M13 15h4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  local: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  store: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9h16v2a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 11z" /><path d="M5.5 13.5V20h13v-6.5M10 20v-4h4v4" /></>,
  team: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 14.3A4.6 4.6 0 0 1 21 19" /></>,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
