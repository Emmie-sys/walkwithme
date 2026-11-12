import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import { findLandmark, landmarks } from '../data/landmarks';
import type { Walk } from '../types';

/** Local diagram map: intentionally illustrative until a reviewed geographic source is integrated. */
export function CampusMap({walk}:{walk?:Walk|null}) {
  const origin=walk&&findLandmark(walk.originId), destination=walk&&findLandmark(walk.destinationId);
  return <View style={{backgroundColor:colors.map,borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:colors.line}}>
    <Svg viewBox="0 0 100 100" width="100%" height={250}>
      <Rect width="100" height="100" fill={colors.map}/>
      <Path d="M8 90L25 70L44 45L63 20L90 10M10 25L35 40L50 55L82 68M18 82L44 45L65 52L90 88" fill="none" stroke="#fff" strokeWidth="3"/>
      <Path d="M8 90L25 70L44 45L63 20L90 10" fill="none" stroke="#D3DDD7" strokeWidth="1"/>
      {landmarks.map(place=><React.Fragment key={place.id}><Rect x={place.x-2.5} y={place.y-2.5} width="5" height="5" rx="1" fill="#CFDAD4"/><SvgText x={place.x} y={place.y+6} textAnchor="middle" fontSize="2.8" fill="#46534D">{place.name}</SvgText></React.Fragment>)}
      {origin&&destination?<><Line x1={origin.x} y1={origin.y} x2={destination.x} y2={destination.y} stroke={colors.primary} strokeWidth="1.5" strokeDasharray="3 2"/><Circle cx={origin.x} cy={origin.y} r="3" fill="#fff" stroke={colors.primary} strokeWidth="1.2"/><Circle cx={destination.x} cy={destination.y} r="3" fill={colors.warning} stroke="#7A5200" strokeWidth=".6"/><Circle cx={(origin.x+destination.x)/2} cy={(origin.y+destination.y)/2} r="3.2" fill={colors.primary} stroke="#fff" strokeWidth="1"/></>:null}
    </Svg>
    <Text style={{fontSize:12,color:colors.muted,padding:10}}>Illustrative campus diagram. It does not display real-time GPS positions.</Text>
  </View>;
}
