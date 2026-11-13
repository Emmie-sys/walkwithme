import * as Location from 'expo-location';
import type { LocationFix, LocationProvider, LocationSubscription, PermissionState } from './LocationProvider';

const permissionState=(status:Location.PermissionStatus):PermissionState=>status==='granted'?'granted':status==='denied'?'denied':'not_requested';
/** Expo adapter keeps platform permission and GPS calls out of feature screens. */
export const expoLocationProvider:LocationProvider={
  async permissionState(){const result=await Location.getForegroundPermissionsAsync();return permissionState(result.status);},
  async requestForegroundPermission(){const result=await Location.requestForegroundPermissionsAsync();return permissionState(result.status);},
  async getCurrentFix(){const result=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});return {latitude:result.coords.latitude,longitude:result.coords.longitude,accuracyMeters:result.coords.accuracy??undefined,capturedAt:new Date(result.timestamp).toISOString()};},
  async watchForeground(onLocation,onError){
    const subscription=await Location.watchPositionAsync({accuracy:Location.Accuracy.Balanced,timeInterval:10000,distanceInterval:20},position=>onLocation({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracyMeters:position.coords.accuracy??undefined,capturedAt:new Date(position.timestamp).toISOString()}),reason=>onError(new Error(reason)));
    return {remove:()=>subscription.remove()} as LocationSubscription;
  },
};
