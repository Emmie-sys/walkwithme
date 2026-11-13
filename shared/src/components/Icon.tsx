import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type AppIconName = 'home' | 'walk' | 'friends' | 'activity' | 'more' | 'brand' | 'close' | 'eye' | 'eyeOff' | 'profile' | 'help' | 'safety' | 'ride';

/** Small, consistent outline icon set for primary navigation and app actions. */
export function AppIcon({ name, color, size = 22 }: { name: AppIconName; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {name === 'home' ? <><Path {...common} d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5.5v-6.5h-4V21H4.5a1 1 0 0 1-1-1z" /></> : null}
      {name === 'walk' ? <><Circle {...common} cx="12" cy="4.5" r="2" /><Path {...common} d="m10.5 8 3.5 2 3 0M11 8l-2 5 3 2-1 5M13 10l-1 4 4 2 1 4" /></> : null}
      {name === 'friends' ? <><Circle {...common} cx="9" cy="8" r="3" /><Circle {...common} cx="17" cy="9" r="2.2" /><Path {...common} d="M3.5 20a5.5 5.5 0 0 1 11 0M14.5 15a4.5 4.5 0 0 1 6 4.2" /></> : null}
      {name === 'activity' ? <><Path {...common} d="M3 12h4l2.2-6 4.2 12 2.4-6H21" /></> : null}
      {name === 'more' ? <><Circle cx="12" cy="5" r="1.3" fill={color} /><Circle cx="12" cy="12" r="1.3" fill={color} /><Circle cx="12" cy="19" r="1.3" fill={color} /></> : null}
      {name === 'brand' ? <><Circle {...common} cx="12" cy="12" r="9" /><Circle {...common} cx="12" cy="12" r="4" /><Path {...common} d="M12 3v2M21 12h-2M12 21v-2M3 12h2" /></> : null}
      {name === 'close' ? <Path {...common} d="m6 6 12 12M18 6 6 18" /> : null}
      {name === 'eye' ? <><Path {...common} d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" /><Circle {...common} cx="12" cy="12" r="2.6" /></> : null}
      {name === 'eyeOff' ? <><Path {...common} d="m3 3 18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6.3 0 9.5 6 9.5 6a15 15 0 0 1-3 3.6M6.2 6.2C3.8 7.7 2.5 12 2.5 12s3.2 6 9.5 6c.8 0 1.6-.1 2.3-.3" /><Path {...common} d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></> : null}
      {name === 'profile' ? <><Circle {...common} cx="12" cy="8" r="3.2" /><Path {...common} d="M4.5 20a7.5 7.5 0 0 1 15 0" /></> : null}
      {name === 'help' ? <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 3M12 17.5v.1" /></> : null}
      {name === 'safety' ? <><Path {...common} d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><Path {...common} d="m8.5 12 2.2 2.2 4.8-5"/></> : null}
      {name === 'ride' ? <><Path {...common} d="M5 16 3.8 12l1.7-5h13l1.7 5-1.2 4zM5 16v3m14-3v3M4 12h16"/><Circle {...common} cx="7.5" cy="15" r="1"/><Circle {...common} cx="16.5" cy="15" r="1"/></> : null}
    </Svg>
  );
}
