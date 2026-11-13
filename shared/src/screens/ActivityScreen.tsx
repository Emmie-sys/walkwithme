import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Muted, Pill, Title, useUi } from '../components/ui';
import { findLandmark } from '../data/landmarks';
import { space } from '../theme';
import type { Invitation, Notice, Walk } from '../types';

export function ActivityScreen({activityRevision,onJoined,onBadgesChanged}:{activityRevision:number;onJoined:()=>void;onBadgesChanged:()=>void}) {
  const ui = useUi();
  const [tab,setTab]=useState<'alerts'|'invites'|'history'>('alerts'),[notices,setNotices]=useState<Notice[]>([]),[invitations,setInvitations]=useState<Invitation[]>([]),[walks,setWalks]=useState<Walk[]>([]);
  const reload=()=>Promise.all([api.notices(),api.invitations(),api.walks()]).then(([n,i,w])=>{setNotices(n);setInvitations(i);setWalks(w);}).catch(e=>Alert.alert('Could not load activity',String(e)));
  useEffect(()=>{void reload();},[activityRevision]);
  const respond=async(id:string,accept:boolean)=>{try{await api.answerInvitation(id,accept);if(accept)onJoined();await reload();}catch(e){Alert.alert('Could not respond',String(e));}};
  const tabs:[typeof tab,string][]=[['alerts','Alerts'],['invites','Invites'],['history','History']];
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle="Invitations, walk updates and recent journeys.">Activity</Title>
    <View style={{flexDirection:'row',gap:8}}>{tabs.map(([id,label])=><Button key={id} title={label} variant={tab===id?'primary':'secondary'} onPress={()=>setTab(id)}/>)}</View>
    {tab==='alerts'?<><Button title="Mark all as read" variant="quiet" onPress={async()=>{try{await api.markRead();await reload();onBadgesChanged();}catch(e){Alert.alert('Could not update',String(e));}}}/>{notices.map(n=><Card key={n.id}><Text style={ui.personName}>{n.kind.replaceAll('_',' ')}</Text><Muted>{n.body}</Muted><Muted>{new Date(n.createdAt).toLocaleString()}</Muted>{!n.readAt?<Button title="Mark read" variant="quiet" onPress={async()=>{try{await api.markRead(n.id);await reload();onBadgesChanged();}catch(e){Alert.alert('Could not update',String(e));}}}/>:null}</Card>)}{notices.length===0?<Card><Muted>You are all caught up.</Muted></Card>:null}</>
    :tab==='invites'?invitations.map(i=><Card key={i.id}><Text style={ui.personName}>{i.sender.name} invited you</Text><Muted>{findLandmark(i.originId)?.name} → {findLandmark(i.destinationId)?.name}</Muted><View style={{flexDirection:'row',gap:8,marginTop:12}}><Button title="Join walk" onPress={()=>void respond(i.id,true)}/><Button title="Decline" variant="secondary" onPress={()=>void respond(i.id,false)}/></View></Card>)
    :walks.map(w=><Card key={w.id}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={[ui.personName,{flex:1}]}>{findLandmark(w.originId)?.name} → {findLandmark(w.destinationId)?.name}</Text><Pill tone={w.status==='completed'?'green':'amber'}>{w.status}</Pill></View><Muted>{new Date(w.createdAt).toLocaleString()} · {w.participants.length} participants</Muted></Card>)}
    {tab!=='alerts'&&(tab==='invites'?invitations.length===0:walks.length===0)?<Card><Muted>{tab==='invites'?'No pending invitations.':'Your completed and active walks will appear here.'}</Muted></Card>:null}
  </ScrollView>;
}
