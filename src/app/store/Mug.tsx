export function Mug({ className = "", glaze = "#e9e2d6" }: { className?: string; glaze?: string }) {
  const k = glaze.replace("#", "m");
  return (
    <svg viewBox="0 0 400 400" className={className} aria-label="Speckled stoneware mug">
      <defs>
        <radialGradient id={`bg-${k}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#faf7f2" />
          <stop offset="100%" stopColor="#e7ded0" />
        </radialGradient>
        <linearGradient id={`body-${k}`} x1="0" x2="1">
          <stop offset="0%" stopColor={glaze} />
          <stop offset="55%" stopColor="#fbf8f3" />
          <stop offset="100%" stopColor="#d9cfbf" />
        </linearGradient>
        <pattern id={`speck-${k}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="6" r="1.4" fill="#6b5b4b" opacity=".55" />
          <circle cx="15" cy="3" r="1" fill="#6b5b4b" opacity=".45" />
          <circle cx="11" cy="15" r="1.6" fill="#6b5b4b" opacity=".5" />
          <circle cx="19" cy="18" r=".9" fill="#6b5b4b" opacity=".4" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill={`url(#bg-${k})`} />
      <ellipse cx="195" cy="318" rx="120" ry="16" fill="#000" opacity=".12" />
      <path d="M268 160 C 330 160, 330 260, 262 262" fill="none" stroke="#d6ccbc" strokeWidth="26" strokeLinecap="round" />
      <path d="M100 120 L 106 300 Q 108 318 130 318 L 260 318 Q 282 318 284 300 L 290 120 Z" fill={`url(#body-${k})`} />
      <path d="M100 120 L 106 300 Q 108 318 130 318 L 260 318 Q 282 318 284 300 L 290 120 Z" fill={`url(#speck-${k})`} />
      <path d="M104 230 L 106 300 Q 108 318 130 318 L 260 318 Q 282 318 284 300 L 287 230 Z" fill="#8a6a4f" opacity=".85" />
      <ellipse cx="195" cy="120" rx="95" ry="18" fill="#efe8dc" />
      <ellipse cx="195" cy="122" rx="84" ry="13" fill="#5a3d2b" />
    </svg>
  );
}
