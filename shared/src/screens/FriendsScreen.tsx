import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Muted, Title, ui } from '../components/ui';
import { space } from '../theme';
import type { User } from '../types';

export function FriendsScreen({friends,activityRevision,onChanged}:{friends:User[];activityRevision:number;onChanged:()=>void}) {
  const [query,setQuery]=useState(''),[results,setResults]=useState<User[]>([]),[requests,setRequests]=useState<{id:string;user:User;createdAt:string}[]>([]),[sentIds,setSentIds]=useState<string[]>([]);
  useEffect(()=>{api.friends().then(value=>setRequests(value.requests)).catch(()=>{});},[activityRevision,friends.length]);
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{if(query.trim())api.searchStudents(query).then(x=>active&&setResults(x)).catch(()=>{});else setResults([]);},250);return()=>{active=false;clearTimeout(timer);};},[query]);
  const action=async(fn:()=>Promise<unknown>,message:string)=>{try{await fn();onChanged();Alert.alert(message);}catch(e){Alert.alert('Could not update friends',String(e));}};
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:40}}><Title subtitle="Only accepted friends can invite you to a walk.">Friends</Title>
    {requests.length>0?<><Text style={[ui.personName,ui.section]}>Friend requests</Text>{requests.map(request=><Card key={request.id}><Text style={ui.personName}>{request.user.name}</Text><Muted>{request.user.email}</Muted><View style={{flexDirection:'row',gap:8}}><Button title="Accept" onPress={()=>action(()=>api.acceptFriend(request.id),'Friend request accepted')}/><Button title="Decline" variant="secondary" onPress={()=>action(()=>api.declineFriend(request.id),'Friend request declined')}/></View></Card>)}</>:null}
    <Field value={query} onChangeText={setQuery} placeholder="Find a student by name or email" autoCapitalize="none"/>
    {results.map(p=><Card key={p.id}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Text style={ui.personName}>{p.name}</Text><Muted>{p.email}</Muted></View><Button title={sentIds.includes(p.id)?'Sent':'Request'} disabled={sentIds.includes(p.id)} onPress={()=>action(async()=>{await api.requestFriend(p.id);setSentIds(ids=>[...ids,p.id]);},'Friend request sent')}/></View></Card>)}
    <Text style={[ui.personName,ui.section]}>Your friends ({friends.length})</Text>
    {friends.map(p=><Card key={p.id}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Text style={ui.personName}>{p.name}</Text><Muted>Availability: {p.availability}</Muted></View><Button title="Remove" variant="secondary" onPress={()=>Alert.alert('Remove friend?',`${p.name} will be removed from your friend list.`,[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>void action(()=>api.removeFriend(p.id),'Friend removed')}])}/></View></Card>)}
    {friends.length===0?<Card><Muted>You have not added any friends yet. Search for a student above.</Muted></Card>:null}
    <Muted>Availability is shown without location. Friend requests require both students to take action.</Muted>
  </ScrollView>;
}
