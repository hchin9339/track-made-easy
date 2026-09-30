export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 42 42" role="img">
        <path d="M7 8h28v8H24v19h-8V16H7z" fill="currentColor" />
        <path d="M24 19h11v8H24z" fill="#65c18c" />
        <path d="M10 5h22" stroke="rgba(255,255,255,.34)" strokeWidth="1.4" />
      </svg>
    </span>
  );
}
