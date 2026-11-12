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
  watchForeground(onLocation:(fix:LocationFix)=>void,onError:(error:Error)=>void):Promise<LocationSubscription>;
}

/** Default provider prevents accidental collection until location policy and UI consent are approved. */
export const disabledLocationProvider:LocationProvider={
  async permissionState(){return 'unavailable';},
  async requestForegroundPermission(){return 'unavailable';},
  async watchForeground(){throw new Error('Location collection is not enabled in this build.');},
};
