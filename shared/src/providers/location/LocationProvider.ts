/**
 * Platform-neutral contract for a future reviewed location integration.
 * Implementations must request permission only after an explicit user action and must
 * publish only while a participant's server-authorized walk membership is active.
 */
export type PermissionState='not_requested'|'granted'|'denied'|'unavailable';
export type LocationFix={latitude:number;longitude:number;accuracyMeters?:number;capturedAt:string};
export type LocationSubscription={remove:()=>void};
export interface LocationProvider {
  permissionState():Promise<PermissionState>;
  requestForegroundPermission():Promise<PermissionState>;
  getCurrentFix():Promise<LocationFix>;
  watchForeground(onLocation:(fix:LocationFix)=>void,onError:(error:Error)=>void):Promise<LocationSubscription>;
}

/** Deny-all provider for previews/tests that must not request device location. */
export const disabledLocationProvider:LocationProvider={
  async permissionState(){return 'unavailable';},
  async requestForegroundPermission(){return 'unavailable';},
  async getCurrentFix(){throw new Error('Location is unavailable in this provider.');},
  async watchForeground(){throw new Error('Location collection is not enabled in this build.');},
};
