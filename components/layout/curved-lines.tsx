// Clean solid colored geometric blocks matching the building color patches from /play.
// Varied shapes: squares, vertical rectangles, and horizontal rectangles.
// Palette: #38bdf8 (cyan), #fbbf24 (amber), #f87171 (coral), #34d399 (emerald), #fb7185 (rose)
const BOXES_1 = [
  // Vertical rectangle (left top)
  { x: 55, y: 130, w: 38, h: 88, fill: '#38bdf8', opacity: 0.28 },
  // Square (left upper)
  { x: 130, y: 290, w: 52, h: 52, fill: '#fbbf24', opacity: 0.26 },
  // Horizontal rectangle (left lower)
  { x: 45, y: 530, w: 105, h: 36, fill: '#f87171', opacity: 0.25 },
  // Vertical rectangle (left bottom)
  { x: 110, y: 740, w: 42, h: 95, fill: '#34d399', opacity: 0.26 },
  // Square (right top)
  { x: 1280, y: 150, w: 48, h: 48, fill: '#fb7185', opacity: 0.26 },
  // Vertical rectangle (right mid)
  { x: 1240, y: 350, w: 40, h: 90, fill: '#38bdf8', opacity: 0.28 },
  // Horizontal rectangle (right lower)
  { x: 1260, y: 640, w: 110, h: 38, fill: '#fbbf24', opacity: 0.26 },
  // Square (top edge accent)
  { x: 880, y: 55, w: 34, h: 34, fill: '#34d399', opacity: 0.22 },
]

const BOXES_2 = [
  // Horizontal rectangle (left mid)
  { x: 120, y: 410, w: 95, h: 32, fill: '#fb7185', opacity: 0.26 },
  // Square (left bottom)
  { x: 60, y: 830, w: 46, h: 46, fill: '#fbbf24', opacity: 0.26 },
  // Horizontal rectangle (right upper)
  { x: 1220, y: 240, w: 100, h: 34, fill: '#f87171', opacity: 0.25 },
  // Square (right mid)
  { x: 1310, y: 490, w: 50, h: 50, fill: '#34d399', opacity: 0.26 },
  // Vertical rectangle (right bottom)
  { x: 1250, y: 760, w: 42, h: 92, fill: '#fb7185', opacity: 0.26 },
  // Square (right bottom edge)
  { x: 1310, y: 890, w: 36, h: 36, fill: '#38bdf8', opacity: 0.28 },
  // Horizontal rectangle (top left edge)
  { x: 480, y: 45, w: 80, h: 26, fill: '#38bdf8', opacity: 0.22 },
]

export function CurvedLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Floating Building Color Blocks — Group 1 */}
        <g className="curve-float">
          {BOXES_1.map((b, i) => (
            <rect
              key={`b1-${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill={b.fill}
              opacity={b.opacity}
            />
          ))}
        </g>

        {/* Floating Building Color Blocks — Group 2 */}
        <g className="curve-float-slow">
          {BOXES_2.map((b, i) => (
            <rect
              key={`b2-${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill={b.fill}
              opacity={b.opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
