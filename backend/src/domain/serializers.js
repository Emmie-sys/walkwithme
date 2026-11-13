export const toIso = value => value ? new Date(`${String(value).replace(' ','T')}Z`).toISOString() : undefined;
export const publicUser = row => row ? ({id:row.id,name:row.name,email:row.email,studentId:row.student_id,availability:row.availability,role:row.role??'student',phoneVerified:!!row.phone_verified_at,savedStart:row.saved_start_label?{label:row.saved_start_label,latitude:row.saved_start_latitude,longitude:row.saved_start_longitude}:null}) : null;
export const notification = row => ({id:row.id,kind:row.kind,body:row.body,createdAt:toIso(row.created_at),readAt:toIso(row.read_at)});
