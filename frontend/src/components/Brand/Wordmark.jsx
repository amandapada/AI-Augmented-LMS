export function Wordmark() {
  return (
    <div className="select-none">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-sky-300"
          >
            <path
              d="M12 2l9 5-9 5-9-5 9-5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M3 7v10l9 5 9-5V7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 12v10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <div className="flex items-baseline gap-2 font-semibold tracking-tight">
          <span className="text-[15px] leading-none text-white/85">ABU LMS</span>
        </div>
      </div>
    </div>
  )
}

