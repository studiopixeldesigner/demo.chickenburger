import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconArrowRight = (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const IconArrowLeft = (p: IconProps) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>;
export const IconArrowUp = (p: IconProps) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Icon>;
export const IconArrowDown = (p: IconProps) => <Icon {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Icon>;
export const IconChevronDown = (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>;
export const IconChevronLeft = (p: IconProps) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>;
export const IconChevronRight = (p: IconProps) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
export const IconPlus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconMinus = (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>;
export const IconX = (p: IconProps) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
export const IconCheck = (p: IconProps) => <Icon {...p}><path d="M5 12l5 5L20 7" /></Icon>;
export const IconMenu = (p: IconProps) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
export const IconSearch = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M21 21l-6-6" /></Icon>;
export const IconInfo = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></Icon>;

export const IconPhone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Icon>
);

export const IconMapPin = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="11" r="3" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
  </Icon>
);

export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);

export const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </Icon>
);

export const IconBag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152A3 3 0 0 1 15.426 21H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8z" />
    <path d="M9 11V6a3 3 0 0 1 6 0v5" />
  </Icon>
);

export const IconBurger = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 11a8 7 0 0 1 16 0z" />
    <path d="M3 14.5h18" />
    <path d="M5 18h14v.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5z" />
  </Icon>
);

export const IconReceipt = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2" />
    <path d="M9 7h6M9 11h6M9 15h4" />
  </Icon>
);

export const IconBadgeCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 7.2A2.2 2.2 0 0 1 7.2 5h1a2.2 2.2 0 0 0 1.55-.64l.7-.7a2.2 2.2 0 0 1 3.12 0l.7.7c.41.41.97.64 1.55.64h1A2.2 2.2 0 0 1 19 7.2v1c0 .58.23 1.14.64 1.55l.7.7a2.2 2.2 0 0 1 0 3.12l-.7.7a2.2 2.2 0 0 0-.64 1.55v1a2.2 2.2 0 0 1-2.2 2.2h-1a2.2 2.2 0 0 0-1.55.64l-.7.7a2.2 2.2 0 0 1-3.12 0l-.7-.7A2.2 2.2 0 0 0 8.2 19h-1A2.2 2.2 0 0 1 5 16.8v-1a2.2 2.2 0 0 0-.64-1.55l-.7-.7a2.2 2.2 0 0 1 0-3.12l.7-.7A2.2 2.2 0 0 0 5 8.2z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const IconGlobe = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
  </Icon>
);

export const IconSnowflake = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    <path d="M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5" />
  </Icon>
);

export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </Icon>
);

export const IconPencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16v4" />
    <path d="M13.5 6.5l4 4" />
  </Icon>
);

export const IconPrinter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
    <path d="M17 9V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4" />
    <rect x="7" y="13" width="10" height="8" rx="2" />
  </Icon>
);

export const IconBell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 5a2 2 0 1 1 4 0 7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6" />
    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
  </Icon>
);

export const IconRefresh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </Icon>
);

export const IconBox = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3" />
    <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
  </Icon>
);

export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M21 12c-2.4 4-5.4 6-9 6s-6.6-2-9-6c2.4-4 5.4-6 9-6s6.6 2 9 6" />
  </Icon>
);

export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
    <path d="M16.681 16.673A8.717 8.717 0 0 1 12 18c-3.6 0-6.6-2-9-6 1.272-2.12 2.712-3.678 4.32-4.674m2.86-1.146A9.055 9.055 0 0 1 12 6c3.6 0 6.6 2 9 6-.666 1.11-1.379 2.067-2.138 2.87" />
    <path d="M3 3l18 18" />
  </Icon>
);

export const IconNote = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 9h8M8 13h6" />
    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
  </Icon>
);

export const IconFlame = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 12c2-2.96 0-7-1-8 0 3.04-1.77 4.74-3 6-1.23 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.53-1.06-3.94-2-5-1.79 3-2.79 3-4 2z" />
  </Icon>
);

export const IconCup = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8h12l-1.5 12.2A2 2 0 0 1 14.5 22h-5a2 2 0 0 1-2-1.8z" />
    <path d="M5 8h14M12 8l2-6h3" />
  </Icon>
);

export const IconFolder = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
  </Icon>
);
