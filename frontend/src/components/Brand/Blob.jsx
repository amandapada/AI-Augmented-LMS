export function Blob({ className }) {
  return (
    <svg
      viewBox="0 0 540 420"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="abuBlob" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.65)" />
          <stop offset="55%" stopColor="rgba(59,130,246,0.25)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.08)" />
        </radialGradient>
        <filter id="abuBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <g filter="url(#abuBlur)">
        <path
          d="M356,38C415,66,474,134,487,206C500,278,467,354,402,382C337,410,240,390,171,344C102,298,61,226,70,165C79,104,138,54,208,30C278,6,297,10,356,38Z"
          fill="url(#abuBlob)"
          opacity="0.95"
        />
        <path
          d="M317,114C363,139,405,191,398,239C391,287,334,331,268,333C202,335,128,295,112,235C96,175,139,95,204,78C269,61,271,89,317,114Z"
          fill="rgba(30,64,175,0.22)"
          opacity="0.9"
        />
      </g>
    </svg>
  )
}

