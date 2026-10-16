import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function BtcMark({ size = 72 }: { size?: number }) {
  return (
    <svg className="btc-mark" width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="36" fill="#F28C28" />
      <path
        d="M40.2 17.2c1.6 0 2.8 1.3 2.6 2.9l-.4 2.2h2.2c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2h-1.1l-1.2 7.2h2.1c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2h-1l-.5 2.7c-.3 1.6-1.7 2.7-3.3 2.6-1.6-.1-2.8-1.4-2.6-3l.4-2.3h-4.2l-.5 2.7c-.3 1.6-1.7 2.7-3.3 2.6-1.6-.1-2.8-1.4-2.6-3l.4-2.3h-2.4c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2h1.3l1.2-7.2h-2.3c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2h1.2l.4-2.2c.3-1.6 1.7-2.7 3.3-2.6 1.6.1 2.8 1.4 2.6 3l-.3 1.8h4.2l.4-2.2c.3-1.6 1.7-2.7 3.3-2.6Zm-6.2 9.5-1.2 7.2h4.2l1.2-7.2h-4.2Z"
        fill="#fff"
      />
    </svg>
  );
}

export function KIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0E7C4A" />
      <path d="M26 16h6v13l10-13h8L36 32l15 16h-8L32 36v12h-6V16Z" fill="#fff" />
      <circle cx="46" cy="14" r="5" fill="#F28C28" />
    </svg>
  );
}

export function MezoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect width="22" height="22" rx="6" fill="#fff" />
      <path d="M5 16V6h2.2l3.8 6.4L14.8 6H17v10h-2.1V9.4L11.6 15h-1.2L7.1 9.4V16H5Z" fill="#0E7C4A" />
    </svg>
  );
}

export function PlantArt() {
  return (
    <svg className="plant" viewBox="0 0 180 150" aria-hidden="true">
      <ellipse cx="108" cy="132" rx="46" ry="10" fill="#0b693e" opacity="0.35" />
      <rect x="78" y="96" width="62" height="36" rx="10" fill="#C4A574" />
      <path d="M86 96c2-14 10-22 22-22s18 10 20 22" fill="#8C5A32" />
      <path d="M92 96c4-8 12-10 18-6 2-10 12-14 20-8-6 6-8 12-6 18" fill="#E7D3B0" opacity="0.7" />
      <circle cx="128" cy="78" r="28" fill="#0E7C4A" />
      <circle cx="128" cy="78" r="22" fill="#14915A" />
      <path d="M120 86V70h5.2l7.6 9.2L140.2 70H146v16h-4.4v-8.6l-6.2 7.4h-2.2l-6.6-7.8V86H120Z" fill="#F3E2C4" />
      <path d="M108 48c-16-28-2-46 8-52 2 18 8 28 22 34-12 2-22 8-30 18Z" fill="#1E9A5A" />
      <path d="M124 40c8-20 24-26 36-24-8 12-10 22-6 34-12-2-22-4-30-10Z" fill="#7DCE6A" />
      <path d="M116 62c-18-6-28-20-30-34 16 2 26 10 34 24 0 4-2 8-4 10Z" fill="#146B3A" />
    </svg>
  );
}

export function BridgeScene() {
  return (
    <svg className="bridge" viewBox="0 0 360 220" aria-hidden="true">
      <ellipse cx="250" cy="36" rx="78" ry="78" fill="#E5F0D8" />
      <path d="M20 150c40-8 60-36 90-36s48 28 78 28 40-20 70-16 48 20 82 8" fill="none" stroke="#9BB58A" strokeWidth="3" />
      <path d="M70 142 V86" stroke="#9BB58A" strokeWidth="3" />
      <path d="M150 134 V70" stroke="#9BB58A" strokeWidth="3" />
      <path d="M230 138 V92" stroke="#9BB58A" strokeWidth="3" />
      <path d="M40 150 C90 40, 130 40, 150 134" fill="none" stroke="#B7CBA4" strokeWidth="2" />
      <path d="M150 134 C190 48, 230 70, 250 138" fill="none" stroke="#B7CBA4" strokeWidth="2" />
      <path d="M250 150c20 8 40 6 70-4" fill="none" stroke="#9BB58A" strokeWidth="3" />
      <path d="M300 120c8 18 8 28 0 40M314 112c10 20 10 34 0 50M286 126c6 14 6 24 0 34" fill="none" stroke="#8FB56E" strokeWidth="2" />
      <circle cx="308" cy="108" r="10" fill="#7DCE6A" />
      <rect x="40" y="168" width="18" height="36" rx="2" fill="#D5E4C4" />
      <rect x="66" y="156" width="14" height="48" rx="2" fill="#C5D8B4" />
      <rect x="86" y="164" width="22" height="40" rx="2" fill="#D5E4C4" />
      <rect x="200" y="160" width="16" height="40" rx="2" fill="#D5E4C4" />
      <rect x="222" y="148" width="12" height="52" rx="2" fill="#C5D8B4" />
    </svg>
  );
}

export function EnvelopeArt() {
  return (
    <svg className="envelope" viewBox="0 0 150 130" aria-hidden="true">
      <path d="M18 28h96l18 22v62a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V28Z" fill="#0E7C4A" />
      <path d="M18 28l48 40L114 28" fill="none" stroke="#F3E7C8" strokeWidth="3" />
      <path d="M114 28l18 22H96L114 28Z" fill="#146B3A" />
      <path d="M30 48h40M30 60h28M30 72h34" stroke="#E7F6D4" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(86 62)">
        <circle cx="28" cy="28" r="26" fill="#F28C28" />
        <path d="M30 14c1.2 0 2.2 1 2 2.2l-.4 1.8h2c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6h-.8l-.9 5.4h1.6c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6h-.8l-.3 2c-.2 1.2-1.3 2-2.5 2s-2.1-1.1-1.9-2.3l.3-1.7h-3.2l-.3 2c-.2 1.2-1.3 2-2.5 2s-2.1-1.1-1.9-2.3l.3-1.7h-1.8c-.9 0-1.6-.7-1.6-1.6s.7-1.6 1.6-1.6h1l.9-5.4h-1.7c-.9 0-1.6-.7-1.6-1.6s.7-1.6 1.6-1.6h.9l.3-1.8c.2-1.2 1.3-2 2.5-2s2.1 1.1 1.9 2.3l-.2 1.5h3.2l.3-1.8c.2-1.2 1.3-2 2.5-2Zm-4.6 7.2-.9 5.4h3.2l.9-5.4h-3.2Z" fill="#fff" />
      </g>
    </svg>
  );
}

export function CoinsArt() {
  return (
    <svg className="coins" viewBox="0 0 210 150" aria-hidden="true">
      <ellipse cx="150" cy="28" rx="70" ry="70" fill="#E7F3DC" />
      <path d="M168 18c6 16 4 28-6 40M184 28c8 14 6 26-2 38" stroke="#8FB56E" strokeWidth="3" fill="none" />
      <circle cx="196" cy="22" r="8" fill="#7DCE6A" />
      <path d="M40 118c30-6 48-22 70-22s36 16 62 12" stroke="#B7CBA4" strokeWidth="3" fill="none" />
      <ellipse cx="118" cy="108" rx="46" ry="12" fill="#D7E8C8" />
      <path d="M86 108c0-10 14-18 32-18s32 8 32 18v8H86v-8Z" fill="#E7D7B4" />
      <ellipse cx="118" cy="108" rx="32" ry="8" fill="#C4A574" />
      <g transform="translate(62 28)">
        <ellipse cx="40" cy="18" rx="34" ry="12" fill="#D97818" />
        <path d="M6 18c0 8 15 14 34 14s34-6 34-14V48c0 8-15 14-34 14S6 56 6 48V18Z" fill="#F28C28" />
        <ellipse cx="40" cy="18" rx="34" ry="12" fill="#F6A24E" />
        <path d="M40 10c1.4 0 2.4 1.1 2.2 2.5l-.3 1.6h1.8c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8h-.8l-.8 4.6h1.4c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8H42l-.3 1.6c-.2 1.3-1.4 2.2-2.7 2.1-1.3-.1-2.3-1.2-2.1-2.6l.3-1.1h-2.8l-.3 1.6c-.2 1.3-1.4 2.2-2.7 2.1-1.3-.1-2.3-1.2-2.1-2.6l.3-1.1h-1.6c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8h.9l.8-4.6h-1.5c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8h.8l.3-1.6c.2-1.3 1.4-2.2 2.7-2.1 1.3.1 2.3 1.2 2.1 2.6l-.2 1.1H39l.3-1.6c.2-1.3 1.4-2.2 2.7-2.1Zm-4 6.6-.8 4.6h2.8l.8-4.6H36Z" fill="#fff" />
      </g>
      <g transform="translate(112 46)">
        <ellipse cx="36" cy="16" rx="30" ry="11" fill="#0b693e" />
        <path d="M6 16c0 7 13 12 30 12s30-5 30-12v26c0 7-13 12-30 12S6 49 6 42V16Z" fill="#0E7C4A" />
        <ellipse cx="36" cy="16" rx="30" ry="11" fill="#1C9A58" />
        <path d="M28 12h4.2v7.4l6.4-7.4h5.2L37.2 20l8.6 9.2h-5.4l-6-6.6V30H28V12Z" fill="#F3E2C4" />
      </g>
    </svg>
  );
}

export function PhoneMock() {
  return (
    <svg className="phone" viewBox="0 0 280 250" aria-hidden="true">
      <rect x="78" y="8" width="150" height="230" rx="28" fill="#fff" stroke="#0E7C4A" strokeWidth="8" />
      <rect x="128" y="18" width="50" height="8" rx="4" fill="#E7F0DF" />
      <rect x="112" y="64" width="82" height="82" rx="20" fill="#0E7C4A" />
      <path d="M136 86h10v22l16-22h12l-20 24 22 28h-14l-16-20v20h-10V86Z" fill="#fff" />
      <circle cx="176" cy="78" r="8" fill="#F28C28" />
    </svg>
  );
}

export function Adire() {
  return (
    <svg className="adire" viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="#0E7C4A" strokeWidth="1.4">
        <rect x="12" y="12" width="46" height="46" />
        <rect x="22" y="22" width="26" height="26" />
        <path d="M78 16h36v36H78z" />
        <path d="M90 28h12v12H90z" />
        <circle cx="156" cy="36" r="18" />
        <path d="M28 92l18 18-18 18-18-18z" />
        <path d="M70 100h28v28H70zM78 108h12v12H78z" />
        <path d="M120 88h44v44h-44zM132 100h20v20h-20z" />
        <path d="M24 150h30v30H24zM34 160h10v10H34z" />
        <circle cx="100" cy="168" r="14" />
        <path d="M150 140l16 22h-32z" />
      </g>
    </svg>
  );
}

export function BottomWave() {
  return (
    <svg className="wave" viewBox="0 0 390 110" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 48c70-28 120-8 180 6 50 12 90-20 140-8 28 6 50 16 70 14v50H0V48Z" fill="#12824E" />
      <path d="M0 70c80-20 130 16 200 8 60-8 90 10 190 0v32H0V70Z" fill="#0E7C4A" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="14.5" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v10M8 10l4 4 4-4M6 19h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 5h5v5M19 5 10 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SwapArrows(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 6v12M8 6 5 9M8 6l3 3M16 18V6M16 18l-3-3M16 18l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3 6 13h5l-1 8 8-12h-5l0-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 7-8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 17c.6-2.2 2.4-3.4 4.5-3.4s3.9 1.2 4.5 3.4M14 13.8c1.4.2 2.6 1 3.3 2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h16M5 15h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function NairaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 7v10M15 7v10M9 8l6 8M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
