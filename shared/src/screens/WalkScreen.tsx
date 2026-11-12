import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { CampusMap } from '../components/CampusMap';
import { Button, Card, Field, Label, Muted, Pill, Title, ui } from '../components/ui';
import { findLandmark, landmarks } from '../data/landmarks';
import { subscribeToWalk } from '../realtime/walkSocket';
import { space } from '../theme';
import type { Message, User, Walk } from '../types';

export function WalkScreen({friends,walk,userId,onWalkChanged}:{friends:User[];walk:Walk|null;userId:string;onWalkChanged:()=>void}) {
  const [origin,setOrigin]=useState(landmarks[1].id),[destination,setDestination]=useState(''),[inviteIds,setInviteIds]=useState<string[]>([]),[sharing,setSharing]=useState(false),[messages,setMessages]=useState<Message[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[inviteOpen,setInviteOpen]=useState(false),[pendingInviteIds,setPendingInviteIds]=useState<string[]>([]);
  useEffect(()=>{api.settings().then(value=>setSharing(value.shareByDefault)).catch(()=>{});},[]);
  useEffect(()=>{if(walk)api.walkInvitations(walk.id).then(rows=>setPendingInviteIds(rows.map(row=>row.recipientId))).catch(()=>{});},[walk?.id]);
  useEffect(()=>{if(!walk)return;let active=true;const load=()=>api.messages(walk.id).then(rows=>{if(active)setMessages(rows);}).catch(()=>{});void load();const id=setInterval(load,8000);return()=>{active=false;clearInterval(id);};},[walk?.id]);
  useEffect(()=>{if(!walk)return;return subscribeToWalk(walk.id,{onMessage:received=>setMessages(rows=>rows.some(row=>row.id===received.id)?rows:[...rows,received]),onWalkChanged:()=>onWalkChanged()});},[walk?.id]);
  const toggleInvite=(id:string)=>setInviteIds(xs=>xs.includes(id)?xs.filter(v=>v!==id):[...xs,id]);
  const start=async()=>{if(!destination||destination===origin){Alert.alert('Choose a destination','Start and destination must be different.');return;}setBusy(true);try{await api.createWalk({originId:origin,destinationId:destination,inviteUserIds:inviteIds,sharingEnabled:sharing});onWalkChanged();}catch(e){Alert.alert('Could not start walk',String(e));}finally{setBusy(false);}};
  const myParticipant=walk?.participants.find(p=>p.userId===userId),sharingOn=!!myParticipant?.sharingEnabled;
  const finish=()=>Alert.alert(walk?.ownerId===userId?'End this walk?':'Leave this walk?',walk?.ownerId===userId?'This stops sharing for everyone.':'You will leave the participant list and your sharing preference will stop.',[{text:'Keep walking',style:'cancel'},{text:walk?.ownerId===userId?'End walk':'Leave walk',style:'destructive',onPress:async()=>{try{if(walk){if(walk.ownerId===userId)await api.endWalk(walk.id);else await api.leaveWalk(walk.id);}onWalkChanged();}catch(e){Alert.alert('Could not update walk',String(e));}}}]);
  const inviteFriend=async(friendId:string)=>{if(!walk)return;try{await api.inviteToWalk(walk.id,friendId);setPendingInviteIds(ids=>[...ids,friendId]);setInviteOpen(false);Alert.alert('Invitation sent','Your friend can choose whether to join.');}catch(e){Alert.alert('Could not invite friend',String(e));}};
  const send=async()=>{if(!walk||!message.trim())return;try{const added=await api.sendMessage(walk.id,message.trim());setMessages(xs=>xs.some(row=>row.id===added.id)?xs:[...xs,added]);setMessage('');}catch(e){Alert.alert('Message not sent',String(e));}};
  if(!walk)return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle="Choose a campus destination and invite friends you trust.">New walk</Title>
    <Card><Label>Starting point</Label>{landmarks.map(p=><Button key={p.id} title={`${origin===p.id?'✓ ':''}${p.name}`} variant={origin===p.id?'primary':'secondary'} onPress={()=>setOrigin(p.id)}/>)}
      <Label>Destination</Label>{landmarks.filter(p=>p.id!==origin).map(p=><Button key={p.id} title={`${destination===p.id?'✓ ':''}${p.name}`} variant={destination===p.id?'primary':'secondary'} onPress={()=>setDestination(p.id)}/>)}
    </Card>
    <Text style={[ui.personName,ui.section]}>Invite friends (optional)</Text>{friends.map(f=><Button key={f.id} title={`${inviteIds.includes(f.id)?'☑':'□'}  ${f.name}`} variant={inviteIds.includes(f.id)?'primary':'secondary'} onPress={()=>toggleInvite(f.id)}/>)}
    <Button title={`Position sharing: ${sharing?'On':'Off'}`} variant="secondary" onPress={()=>setSharing(!sharing)}/><Muted>Sharing is off by default. The current build records your preference but does not collect or transmit GPS coordinates. You can change this before starting.</Muted>
    <Button title={busy?'Starting…':'Start walk'} disabled={busy} onPress={start}/>
  </ScrollView>;
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle={`From ${findLandmark(walk.originId)?.name??'campus'} to ${findLandmark(walk.destinationId)?.name??'destination'}`}>Walk in progress</Title>
    <View style={{flexDirection:'row',gap:8,marginBottom:12}}><Pill tone={sharingOn?'green':'amber'}>Your sharing {sharingOn?'on':'off'}</Pill><Pill>{walk.status}</Pill></View><CampusMap walk={walk}/>
    <Button title={sharingOn?'Pause position sharing':'Resume position sharing'} variant="secondary" onPress={async()=>{try{await api.setWalkSharing(walk.id,!sharingOn);onWalkChanged();}catch(e){Alert.alert('Could not update sharing',String(e));}}}/>
    <Muted>This control saves your consent preference. GPS coordinates are not collected or transmitted by this build.</Muted>
    <Card><Text style={ui.personName}>Participants</Text>{walk.participants.map(p=><View key={p.userId} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#E7ECE9'}}><Text style={ui.personName}>{p.name}</Text><Muted>{p.userId===walk.ownerId?'Organizer · ':''}{p.status==='joined'?(p.sharingEnabled?'Sharing opted-in position':'Position not shared'): 'Left walk'}</Muted></View>)}</Card>
    <Card><Text style={ui.personName}>Walk chat</Text><View style={{maxHeight:190}}>{messages.slice(-8).map(m=><Text key={m.id} style={{paddingVertical:6,color:'#17211E'}}><Text style={{fontWeight:'700'}}>{m.name}: </Text>{m.body}</Text>)}{messages.length===0?<Muted>No messages yet. Say hello to your group.</Muted>:null}</View><Label>Message</Label><Field value={message} onChangeText={setMessage} placeholder="Write a message" maxLength={300}/><Button title="Send message" onPress={send}/></Card>
    <Button title="Invite another friend" variant="secondary" onPress={()=>setInviteOpen(true)}/>
    <Button title="Report a problem" variant="secondary" onPress={async()=>{try{await api.report('Walk issue reported by participant');Alert.alert('Report saved','The local development server stored this report.');}catch(e){Alert.alert('Could not submit',String(e));}}}/>
    <Button title={walk.ownerId===userId?'End walk':'Leave walk'} variant="danger" onPress={finish}/>
    <Modal visible={inviteOpen} transparent animationType="fade" onRequestClose={()=>setInviteOpen(false)}><View style={{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:20}}><Card><Text style={{fontSize:20,fontWeight:'800',color:'#17211E'}}>Invite a friend</Text><Muted>They choose whether to join. Their position stays off unless they opt in.</Muted><ScrollView style={{maxHeight:320,marginTop:10}}>{friends.filter(f=>!walk.participants.some(p=>p.userId===f.id)).map(friend=><Button key={friend.id} title={pendingInviteIds.includes(friend.id)?`${friend.name} · Invited`:`Invite ${friend.name}`} disabled={pendingInviteIds.includes(friend.id)} variant="secondary" onPress={()=>void inviteFriend(friend.id)}/>)}</ScrollView><Button title="Close" variant="quiet" onPress={()=>setInviteOpen(false)}/></Card></View></Modal>
  </ScrollView>;
}
