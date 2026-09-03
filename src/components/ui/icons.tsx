import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" {...props}>{children}</svg>;
}

export function PlayIcon(props: IconProps) { return <Icon {...props}><path d="m8 5 11 7-11 7V5Z" fill="currentColor" /></Icon>; }
export function PauseIcon(props: IconProps) { return <Icon {...props}><path d="M8 5v14M16 5v14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" /></Icon>; }
export function VolumeIcon(props: IconProps) { return <Icon {...props}><path d="M4 10v4h4l5 4V6L8 10H4Zm12.5-1.5a5 5 0 0 1 0 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function MutedIcon(props: IconProps) { return <Icon {...props}><path d="M4 10v4h4l5 4V6L8 10H4Zm12-1 5 6m0-6-5 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>; }
export function HeartIcon(props: IconProps) { return <Icon {...props}><path d="M20.8 5.9a5.4 5.4 0 0 0-7.7 0L12 7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.4a5.4 5.4 0 0 0 0-7.7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function UploadIcon(props: IconProps) { return <Icon {...props}><path d="M12 16V3m0 0L7 8m5-5 5 5M4 14v6h16v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function UserIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>; }
export function ShareIcon(props: IconProps) { return <Icon {...props}><circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="m8.2 10.8 7.6-4.5m-7.6 6.9 7.6 4.5" stroke="currentColor" strokeWidth="1.8" /></Icon>; }
export function CopyIcon(props: IconProps) { return <Icon {...props}><rect height="13" rx="2" stroke="currentColor" strokeWidth="1.8" width="13" x="8" y="8" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" /></Icon>; }
export function ExternalIcon(props: IconProps) { return <Icon {...props}><path d="M14 4h6v6m0-6-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function CloseIcon(props: IconProps) { return <Icon {...props}><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>; }
export function MusicIcon(props: IconProps) { return <Icon {...props}><path d="M9 18V6l11-2v12M9 9l11-2M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm11-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function ImageIcon(props: IconProps) { return <Icon {...props}><rect height="16" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="4" /><circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="m4 18 5-4 3 2 3-3 5 5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function ArrowIcon(props: IconProps) { return <Icon {...props}><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function ChevronIcon(props: IconProps) { return <Icon {...props}><path d="m7 9 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>; }
export function InfoIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="12" cy="7.5" fill="currentColor" r="1" /></Icon>; }
