import Svg, { Path } from 'react-native-svg';

/** Small right-pointing chevron used as a trailing affordance on cards and tabs. */
export function Chevron({ color }: { color: string }) {
  return (
    <Svg width={6} height={10} viewBox="0 0 6 10" fill="none">
      <Path
        d="M1 1L5 5L1 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
