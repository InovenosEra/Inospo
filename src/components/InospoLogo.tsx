import React from 'react';
import Svg, { Circle, Path, Polygon, Rect, Text as SvgText, Line } from 'react-native-svg';

const GOLD = '#D4AF37';
const NAVY = '#0B1124';

// Computes the 10 alternating points of a 5-pointed star
function starPoints(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const radius = i % 2 === 0 ? R : r;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`
    );
  }
  return pts.join(' ');
}

interface Props {
  size?: number;
}

export default function InospoLogo({ size = 120 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">

      {/* ── Outer gold ring ── */}
      <Circle cx={100} cy={100} r={97} fill={GOLD} />

      {/* ── Badge face (navy) ── */}
      <Circle cx={100} cy={100} r={88} fill={NAVY} />

      {/* ── Inner decorative ring ── */}
      <Circle
        cx={100} cy={100} r={81}
        fill="none" stroke={GOLD} strokeWidth={0.8} opacity={0.35}
      />

      {/* ── Three gold stars ── */}
      <Polygon points={starPoints(80, 47, 6, 2.5)} fill={GOLD} />
      <Polygon points={starPoints(100, 42, 6, 2.5)} fill={GOLD} />
      <Polygon points={starPoints(120, 47, 6, 2.5)} fill={GOLD} />

      {/* ── Trophy ── */}

      {/* Cup bowl: arched rim, straight-ish sides tapering inward, curved bottom */}
      <Path
        d="M 62,70 Q 100,61 138,70 L 124,100 Q 100,108 76,100 Z"
        fill={GOLD}
      />

      {/* Left handle: C-shape, outer & inner bezier curves */}
      <Path
        d="M 72,76 C 42,70 38,106 72,102 C 50,100 50,76 72,76 Z"
        fill={GOLD}
      />

      {/* Right handle: mirror of left */}
      <Path
        d="M 128,76 C 158,70 162,106 128,102 C 150,100 150,76 128,76 Z"
        fill={GOLD}
      />

      {/* Stem */}
      <Rect x={90} y={104} width={20} height={26} rx={2} fill={GOLD} />

      {/* Base: flat top, rounded bottom */}
      <Path
        d="M 68,130 L 132,130 L 132,138 Q 132,148 100,148 Q 68,148 68,138 Z"
        fill={GOLD}
      />

      {/* ── Separator line ── */}
      <Line
        x1={60} y1={155} x2={140} y2={155}
        stroke={GOLD} strokeWidth={0.7} opacity={0.4}
      />

      {/* ── App name ── */}
      <SvgText
        x={100} y={168}
        textAnchor="middle"
        fill={GOLD}
        fontSize={15}
        fontWeight="700"
        letterSpacing={5}
      >
        INOSPO
      </SvgText>

      {/* ── Tagline ── */}
      <SvgText
        x={100} y={179}
        textAnchor="middle"
        fill={GOLD}
        fontSize={8}
        fontWeight="400"
        letterSpacing={3}
        opacity={0.45}
      >
        WC 2026
      </SvgText>

    </Svg>
  );
}
