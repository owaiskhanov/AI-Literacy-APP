import React from 'react';
import { Animated } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Draws a word (from scriptPaths.js) like Apple's "hello": the pen traces each
 * letter's outline at a constant speed, and each letter cleanly fills in as its
 * stroke completes.
 *
 * Props:
 *  - data:        { viewBox, letters: [{ d, length }] }
 *  - progress:    Animated.Value going 0 → 1
 *  - height:      rendered height in px (width follows aspect ratio)
 *  - color:       ink color (can include alpha)
 *  - highlight:   optional color for a deboss highlight drawn 1px below the ink
 *  - strokeWidth: width of the pen stroke
 */
export default function HandwrittenWord({
  data,
  progress,
  height,
  color,
  highlight,
  strokeWidth = 2.2,
}) {
  const [vbX, vbY, vbW, vbH] = data.viewBox;
  const width = (height * vbW) / vbH;
  const unitsPerPx = vbH / height;

  // Allocate 82% of the timeline to stroke tracing, reserving the remaining time
  // so the last letter's stroke and fill are guaranteed 100% completed and solid.
  const DRAW_PORTION = 0.82;
  const total = data.letters.reduce((s, l) => s + l.length, 0);

  let acc = 0;
  const letterTiming = data.letters.map((l) => {
    const s = (acc / total) * DRAW_PORTION;
    acc += l.length;
    const e = (acc / total) * DRAW_PORTION;

    // Stroke length with padding to guarantee full stroke closure
    const strokeLen = Math.ceil(l.length * 1.08 + 8);

    // Smooth fill transition: begins as the stroke nears completion and finishes right after
    const fillStart = Math.max(0, e - (e - s) * 0.35);
    const fillEnd = Math.min(1.0, e + 0.08);

    return {
      strokeStart: s,
      strokeEnd: e,
      strokeLen,
      fillStart,
      fillEnd,
    };
  });

  const renderLetters = (ink, dy = 0) => (
    <G transform={dy ? `translate(0 ${dy})` : undefined}>
      {data.letters.map((letter, i) => {
        const { strokeStart, strokeEnd, strokeLen, fillStart, fillEnd } =
          letterTiming[i];

        const strokeDashoffset = progress.interpolate({
          inputRange: [strokeStart, strokeEnd],
          outputRange: [strokeLen, 0],
          extrapolate: 'clamp',
        });

        const fillOpacity = progress.interpolate({
          inputRange: [fillStart, fillEnd],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });

        return (
          <AnimatedPath
            key={i}
            d={letter.d}
            fill={ink}
            fillOpacity={fillOpacity}
            stroke={ink}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={[strokeLen, strokeLen]}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </G>
  );

  return (
    <Svg
      width={width}
      height={height + (highlight ? 1 : 0)}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH + (highlight ? unitsPerPx : 0)}`}
    >
      {highlight && renderLetters(highlight, unitsPerPx)}
      {renderLetters(color)}
    </Svg>
  );
}
