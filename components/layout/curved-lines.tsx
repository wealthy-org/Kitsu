export function CurvedLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g
          className="curve-float"
          stroke="#22d3ee"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.22}
        >
          <path d="M150 330 C70 330 60 230 130 210 C200 190 240 260 190 300 C150 332 92 318 72 288" />
          <path d="M120 560 C120 470 220 470 220 560 C220 646 120 646 120 724" />
        </g>

        <g
          className="curve-float-slow"
          stroke="#34d399"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.22}
        >
          <path d="M150 470 A30 30 0 1 0 150 410 A30 30 0 1 0 150 470" />
          <path d="M60 240 L60 430 C60 470 130 470 130 430" />
        </g>

        <g
          className="curve-float"
          stroke="#fb7185"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.2}
        >
          <path d="M110 520 C110 640 40 660 30 580 C25 540 70 540 80 580" />
        </g>

        <g
          className="curve-float-slow"
          stroke="#fb923c"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.2}
        >
          <path d="M1330 300 C1250 300 1240 420 1310 440 C1370 455 1390 400 1350 380" />
          <path d="M700 40 C700 110 780 110 780 40" />
        </g>

        <g
          className="curve-float"
          stroke="#34d399"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.2}
        >
          <path d="M1380 260 C1380 380 1300 400 1290 330" />
          <path d="M1290 500 C1230 500 1220 600 1290 620" />
        </g>

        <g
          className="curve-float-slow"
          stroke="#f87171"
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.18}
        >
          <path d="M760 20 C820 20 820 90 760 90" />
        </g>
      </svg>
    </div>
  )
}
