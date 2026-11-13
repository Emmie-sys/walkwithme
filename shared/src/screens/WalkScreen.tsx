import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { CampusMap } from '../components/CampusMap';
import { Button, Card, Field, Label, Muted, Pill, Title, useUi } from '../components/ui';
import { findLandmark, landmarks } from '../data/landmarks';
import { subscribeToWalk } from '../realtime/walkSocket';
import { expoLocationProvider as locationProvider } from '../providers/location/ExpoLocationProvider';
import type { LocationSubscription } from '../providers/location/LocationProvider';
import { space, useTheme } from '../theme';
import type { Message, User, Walk } from '../types';

export function WalkScreen({friends,walk,userId,onWalkChanged}:{friends:User[];walk:Walk|null;userId:string;onWalkChanged:()=>void}) {
  const ui = useUi();
  const { colors } = useTheme();
  const [origin,setOrigin]=useState(landmarks[1].id),[destination,setDestination]=useState(''),[inviteIds,setInviteIds]=useState<string[]>([]),[sharing,setSharing]=useState(false),[messages,setMessages]=useState<Message[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[inviteOpen,setInviteOpen]=useState(false),[pendingInviteIds,setPendingInviteIds]=useState<string[]>([]),[locations,setLocations]=useState<{userId:string;name:string;latitude:number;longitude:number;approximate:true}[]>([]);
  useEffect(()=>{api.settings().then(value=>setSharing(value.shareByDefault)).catch(()=>{});},[]);
  useEffect(()=>{if(walk)api.walkInvitations(walk.id).then(rows=>setPendingInviteIds(rows.map(row=>row.recipientId))).catch(()=>{});},[walk?.id]);
  useEffect(()=>{if(!walk)return;let active=true;const load=()=>api.messages(walk.id).then(rows=>{if(active)setMessages(rows);}).catch(()=>{});void load();const id=setInterval(load,8000);return()=>{active=false;clearInterval(id);};},[walk?.id]);
  useEffect(()=>{if(!walk)return;return subscribeToWalk(walk.id,{onMessage:received=>setMessages(rows=>rows.some(row=>row.id===received.id)?rows:[...rows,received]),onWalkChanged:()=>onWalkChanged()});},[walk?.id]);
  const toggleInvite=(id:string)=>setInviteIds(xs=>xs.includes(id)?xs.filter(v=>v!==id):[...xs,id]);
  const start=async()=>{if(!destination||destination===origin){Alert.alert('Choose a destination','Start and destination must be different.');return;}setBusy(true);try{await api.createWalk({originId:origin,destinationId:destination,inviteUserIds:inviteIds,sharingEnabled:sharing});onWalkChanged();}catch(e){Alert.alert('Could not start walk',String(e));}finally{setBusy(false);}};
  const myParticipant=walk?.participants.find(p=>p.userId===userId),sharingOn=!!myParticipant?.sharingEnabled;
  useEffect(()=>{if(!walk)return;let live=true;const refreshPins=()=>api.walkLocations(walk.id).then(rows=>{if(live)setLocations(rows);}).catch(()=>{});void refreshPins();const timer=setInterval(refreshPins,10000);return()=>{live=false;clearInterval(timer);};},[walk?.id]);
  // Location is requested only after the user has opted into sharing for an active walk.
  useEffect(()=>{if(!walk||!sharingOn)return;let alive=true;let subscription:LocationSubscription|undefined;(async()=>{try{const permission=await locationProvider.requestForegroundPermission();if(!alive)return;if(permission!=='granted'){await api.setWalkSharing(walk.id,false).catch(()=>{});onWalkChanged();Alert.alert('Location permission not granted','Your walk continues with position sharing off. You can enable it later in this walk.');return;}subscription=await locationProvider.watchForeground(fix=>{api.publishWalkLocation(walk.id,fix.latitude,fix.longitude).catch(()=>{});},()=>{});}catch{if(alive){await api.setWalkSharing(walk.id,false).catch(()=>{});onWalkChanged();Alert.alert('Location unavailable','Your walk continues with position sharing off. Try again when location is available.');}}})();return()=>{alive=false;subscription?.remove();};},[walk?.id,sharingOn]);
  const finish=()=>Alert.alert(walk?.ownerId===userId?'End this walk?':'Leave this walk?',walk?.ownerId===userId?'This stops sharing for everyone.':'You will leave the participant list and your sharing preference will stop.',[{text:'Keep walking',style:'cancel'},{text:walk?.ownerId===userId?'End walk':'Leave walk',style:'destructive',onPress:async()=>{try{if(walk){if(walk.ownerId===userId)await api.endWalk(walk.id);else await api.leaveWalk(walk.id);}onWalkChanged();}catch(e){Alert.alert('Could not update walk',String(e));}}}]);
  const inviteFriend=async(friendId:string)=>{if(!walk)return;try{await api.inviteToWalk(walk.id,friendId);setPendingInviteIds(ids=>[...ids,friendId]);setInviteOpen(false);Alert.alert('Invitation sent','Your friend can choose whether to join.');}catch(e){Alert.alert('Could not invite friend',String(e));}};
  const send=async()=>{if(!walk||!message.trim())return;try{const added=await api.sendMessage(walk.id,message.trim());setMessages(xs=>xs.some(row=>row.id===added.id)?xs:[...xs,added]);setMessage('');}catch(e){Alert.alert('Message not sent',String(e));}};
  if(!walk)return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle="Choose a campus destination and invite friends you trust.">New walk</Title>
    <Card><Label>Starting point</Label>{landmarks.map(p=><Button key={p.id} title={`${origin===p.id?'✓ ':''}${p.name}`} variant={origin===p.id?'primary':'secondary'} onPress={()=>setOrigin(p.id)}/>)}
      <Label>Destination</Label>{landmarks.filter(p=>p.id!==origin).map(p=><Button key={p.id} title={`${destination===p.id?'✓ ':''}${p.name}`} variant={destination===p.id?'primary':'secondary'} onPress={()=>setDestination(p.id)}/>)}
    </Card>
    <Text style={[ui.personName,ui.section]}>Invite friends (optional)</Text>{friends.map(f=><Button key={f.id} title={`${inviteIds.includes(f.id)?'☑':'□'}  ${f.name}`} variant={inviteIds.includes(f.id)?'primary':'secondary'} onPress={()=>toggleInvite(f.id)}/>)}
    <Button title={`Position sharing: ${sharing?'On':'Off'}`} variant="secondary" onPress={()=>setSharing(!sharing)}/><Muted>Sharing is off by default. If enabled, the app asks for foreground location and shares an approximate pin only with joined walk participants. You can change this before starting.</Muted>
    <Button title={busy?'Starting…':'Start walk'} disabled={busy} onPress={start}/>
  </ScrollView>;
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle={`From ${findLandmark(walk.originId)?.name??'campus'} to ${findLandmark(walk.destinationId)?.name??'destination'}`}>Walk in progress</Title>
    <View style={{flexDirection:'row',gap:8,marginBottom:12}}><Pill tone={sharingOn?'green':'amber'}>Your sharing {sharingOn?'on':'off'}</Pill><Pill>{walk.status}</Pill></View>
    <Button title={sharingOn?'Pause position sharing':'Resume position sharing'} variant="secondary" onPress={async()=>{try{await api.setWalkSharing(walk.id,!sharingOn);onWalkChanged();}catch(e){Alert.alert('Could not update sharing',String(e));}}}/>
    <Muted>When enabled, foreground GPS is rounded to an approximate map pin and expires after 90 seconds. No background location is collected.</Muted>
    <CampusMap walk={walk} locations={locations}/>
    <Card><Text style={ui.personName}>Participants</Text>{walk.participants.map(p=><View key={p.userId} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.line}}><Text style={ui.personName}>{p.name}</Text><Muted>{p.userId===walk.ownerId?'Organizer · ':''}{p.status==='joined'?(p.sharingEnabled?'Sharing opted-in position':'Position not shared'): 'Left walk'}</Muted></View>)}</Card>
    <Card><Text style={ui.personName}>Walk chat</Text><View style={{maxHeight:190}}>{messages.slice(-8).map(m=><Text key={m.id} style={{paddingVertical:6,color:colors.ink}}><Text style={{fontWeight:'700'}}>{m.name}: </Text>{m.body}</Text>)}{messages.length===0?<Muted>No messages yet. Say hello to your group.</Muted>:null}</View><Label>Message</Label><Field value={message} onChangeText={setMessage} placeholder="Write a message" maxLength={300}/><Button title="Send message" onPress={send}/></Card>
    <Button title="Invite another friend" variant="secondary" onPress={()=>setInviteOpen(true)}/>
    <Button title="I have arrived" variant="secondary" onPress={async()=>{try{const result=await api.markArrived(walk.id);Alert.alert('Arrival noted',`Position sharing will stop automatically in ${result.graceMinutes} minutes.`);onWalkChanged();}catch(e){Alert.alert('Could not mark arrival',String(e));}}}/>
    <Button title="Report a safety concern" variant="secondary" onPress={()=>Alert.alert('Safety report','Open Safety & safe spots from the account menu to place an approximate location and submit a private report for admin review.')}/>
    <Button title={walk.ownerId===userId?'End walk':'Leave walk'} variant="danger" onPress={finish}/>
    <Modal visible={inviteOpen} transparent animationType="fade" onRequestClose={()=>setInviteOpen(false)}><View style={{flex:1,backgroundColor:'rgba(0,0,0,0.55)',justifyContent:'center',padding:20}}><Card><Text style={{fontSize:20,fontWeight:'800',color:colors.ink}}>Invite a friend</Text><Muted>They choose whether to join. Their position stays off unless they opt in.</Muted><ScrollView style={{maxHeight:320,marginTop:10}}>{friends.filter(f=>!walk.participants.some(p=>p.userId===f.id)).map(friend=><Button key={friend.id} title={pendingInviteIds.includes(friend.id)?`${friend.name} · Invited`:`Invite ${friend.name}`} disabled={pendingInviteIds.includes(friend.id)} variant="secondary" onPress={()=>void inviteFriend(friend.id)}/>)}</ScrollView><Button title="Close" variant="quiet" onPress={()=>setInviteOpen(false)}/></Card></View></Modal>
  </ScrollView>;
}
