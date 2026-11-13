import React from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme';
import type { Walk } from '../types';

const GULU={latitude:2.7746,longitude:32.2994};
type WalkLocation={userId:string;name:string;latitude:number;longitude:number;approximate:true};
/** Displays only active, opted-in coarse pins returned by the API. No location is inferred for hidden participants. */
export function CampusMap({walk,locations=[]}:{walk?:Walk|null;locations?:WalkLocation[]}) {
  const { colors } = useTheme();
  const center=locations[0]?{latitude:locations[0].latitude,longitude:locations[0].longitude}:GULU;
  return <View style={{backgroundColor:colors.map,borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:colors.line}}>
    <MapView style={{height:250}} initialRegion={{...center,latitudeDelta:0.035,longitudeDelta:0.035}} region={{...center,latitudeDelta:0.035,longitudeDelta:0.035}}>
      {locations.map(pin=><Marker key={pin.userId} coordinate={{latitude:pin.latitude,longitude:pin.longitude}} title={pin.name} description="Approximate opted-in location" pinColor={pin.userId===walk?.ownerId?colors.primary:colors.warning}/>)}
    </MapView>
    <Text style={{fontSize:12,color:colors.muted,padding:10}}>{locations.length?`${locations.length} approximate location pin${locations.length===1?'':'s'} · positions expire after 90 seconds.`:'No shared positions. Each participant chooses whether to share.'} The map uses an approximate Gulu reference until a university map provider is configured.</Text>
  </View>;
}
