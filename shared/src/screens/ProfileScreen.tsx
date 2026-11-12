import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Muted, Title, ui } from '../components/ui';
import { colors, space } from '../theme';
import type { Settings, User } from '../types';

const initial:Settings={shareByDefault:false,approximateAreas:true,notificationsEnabled:true,invitations:'friends'};
export function ProfileScreen({user,onSignOut}:{user:User;onSignOut:()=>void}) {
  const [settings,setSettings]=useState(initial),[saving,setSaving]=useState(false),[events,setEvents]=useState<{id:string;kind:string;body:string;createdAt:string}[]>([]);
  const loadSafety=()=>api.safetyEvents().then(setEvents).catch(()=>{});
  useEffect(()=>{api.settings().then(setSettings).catch(()=>{});void loadSafety();},[]);
  const update=async(patch:Partial<Settings>)=>{const next={...settings,...patch};setSettings(next);setSaving(true);try{setSettings(await api.saveSettings(next));}catch(e){Alert.alert('Setting not saved',String(e));}finally{setSaving(false);}};
  const safety=(kind:'sos'|'checkIn')=>Alert.alert(kind==='sos'?'Send a safety alert?':'Record safety check-in',kind==='sos'?'The local server records this event only. No person or emergency service will be contacted.':'This records that you are okay on the local development server.',[{text:'Cancel',style:'cancel'},{text:kind==='sos'?'Record alert':'Check in',onPress:async()=>{try{if(kind==='sos')await api.sos();else await api.checkIn();await loadSafety();Alert.alert('Recorded','Saved on the local development server. Nobody was contacted.');}catch(e){Alert.alert('Could not record',String(e));}}}]);
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle="Manage account and walk privacy preferences.">Profile</Title>
    <Card><Text style={ui.personName}>{user.name}</Text><Muted>{user.email} · Student ID {user.studentId??'not provided'}</Muted></Card>
    <Text style={[ui.personName,ui.section]}>Privacy centre</Text><Card>
      <Setting label="Share position by default" description="You can still choose for each walk." value={settings.shareByDefault} onChange={v=>void update({shareByDefault:v})}/>
      <Setting label="Approximate area display" description="Intended as a reduced precision option when location integration is enabled." value={settings.approximateAreas} onChange={v=>void update({approximateAreas:v})}/>
      <Setting label="Notifications" description="Walk, friend and invitation alerts." value={settings.notificationsEnabled} onChange={v=>void update({notificationsEnabled:v})}/>
      <Text style={{fontWeight:'700',color:colors.ink,marginTop:14}}>Who can invite you</Text><View style={{flexDirection:'row',gap:8,marginTop:8}}><Button title="Friends only" variant={settings.invitations==='friends'?'primary':'secondary'} onPress={()=>void update({invitations:'friends'})}/><Button title="No one" variant={settings.invitations==='none'?'primary':'secondary'} onPress={()=>void update({invitations:'none'})}/></View>
      {saving?<Muted>Saving…</Muted>:null}
    </Card>
    <Muted>Location permission is not requested in this build. Position sharing preferences are stored, but coordinates are not collected or sent.</Muted>
    <Text style={[ui.personName,ui.section]}>Safety</Text><Card><Muted>Local development mode: neither action below contacts anyone.</Muted><Button title="Record SOS alert" variant="danger" onPress={()=>safety('sos')}/><Button title="I'm safe — check in" variant="secondary" onPress={()=>safety('checkIn')}/>{events.map(event=><View key={event.id} style={{paddingVertical:10,borderTopWidth:1,borderTopColor:colors.line}}><Text style={{fontWeight:'700',color:colors.ink}}>{event.kind.replaceAll('_',' ')}</Text><Muted>{event.body}</Muted><Muted>{new Date(event.createdAt).toLocaleString()}</Muted></View>)}</Card>
    <Button title="Sign out" variant="secondary" onPress={onSignOut}/>
  </ScrollView>;
}
function Setting({label,description,value,onChange}:{label:string;description:string;value:boolean;onChange:(v:boolean)=>void}) {return <View style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}><View style={{flex:1,paddingRight:10}}><Text style={{fontWeight:'700',color:colors.ink}}>{label}</Text><Muted>{description}</Muted></View><Switch value={value} onValueChange={onChange} trackColor={{true:colors.primarySoft}} thumbColor={value?colors.primary:'#f4f3f4'} accessibilityLabel={label}/></View>;}
