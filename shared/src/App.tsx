import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api } from './api';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { WalkScreen } from './screens/WalkScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { subscribeToActivity } from './realtime/walkSocket';
import { colors, space } from './theme';
import type { Invitation, User, Walk } from './types';

type Tab='home'|'walk'|'friends'|'activity'|'profile';
/** App shell owns only navigation and shared remote state; feature behavior stays in screens/services. */
export default function App() {
  const [user,setUser]=useState<User|null>(null),[tab,setTab]=useState<Tab>('home'),[friends,setFriends]=useState<User[]>([]),[invitations,setInvitations]=useState<Invitation[]>([]),[walk,setWalk]=useState<Walk|null>(null),[refreshing,setRefreshing]=useState(false),[activityRevision,setActivityRevision]=useState(0);
  const refresh=useCallback(async()=>{if(!user)return;setRefreshing(true);try{const [home,active]=await Promise.all([api.home(),api.activeWalk()]);setFriends(home.friends);setInvitations(home.invitations);setWalk(active);}catch(e){Alert.alert('Connection problem',`${String(e)}\n\nCheck the API server and EXPO_PUBLIC_API_URL.`);}finally{setRefreshing(false);}},[user]);
  useEffect(()=>{if(user)void refresh();},[user,refresh]);
  useEffect(()=>{if(!user)return;return subscribeToActivity(()=>{setActivityRevision(value=>value+1);void refresh();});},[user,refresh]);
  // A modest polling loop gives two local clients an up-to-date walk without hiding the transport choice.
  useEffect(()=>{if(!user||!walk)return;const id=setInterval(()=>{api.activeWalk().then(setWalk).catch(()=>{});},12000);return()=>clearInterval(id);},[user,walk?.id]);
  const signedIn=(next:User)=>{setUser(next);setTab('home');};
  const signOut=()=>{api.logout();setUser(null);setWalk(null);setFriends([]);setInvitations([]);};
  if(!user)return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor={colors.canvas}/><SafeAreaView style={{flex:1,backgroundColor:colors.canvas}}><AuthScreen onSignedIn={signedIn}/></SafeAreaView></SafeAreaProvider>;
  const renderScreen=()=>{
    switch(tab){
      case 'home':return <HomeScreen user={user} friends={friends} invitations={invitations} walk={walk} onNavigate={next=>setTab(next as Tab)}/>;
      case 'walk':return <WalkScreen friends={friends} walk={walk} userId={user.id} onWalkChanged={()=>void refresh()}/>;
      case 'friends':return <FriendsScreen friends={friends} activityRevision={activityRevision} onChanged={()=>void refresh()}/>;
      case 'activity':return <ActivityScreen activityRevision={activityRevision} onJoined={()=>{setTab('walk');void refresh();}}/>;
      case 'profile':return <ProfileScreen user={user} onSignOut={signOut}/>;
    }
  };
  const tabs:[Tab,string,string][]=[['home','⌂','Home'],['walk','↗','Walk'],['friends','♧','Friends'],['activity','◷','Activity'],['profile','○','Profile']];
  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor={colors.canvas}/><SafeAreaView style={{flex:1,backgroundColor:colors.canvas}}>
    <View style={{height:54,paddingHorizontal:space.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:colors.line,backgroundColor:colors.surface}}><Text style={{fontSize:17,fontWeight:'800',color:colors.primary}}>◉  Walk with Me</Text><Pressable accessibilityRole="button" onPress={()=>Alert.alert('Emergency support','This local development build cannot contact campus security, police, or emergency services. Use your local emergency number if you need immediate help.')} style={{backgroundColor:colors.danger,borderRadius:99,paddingHorizontal:14,paddingVertical:8}}><Text style={{fontWeight:'800',color:'#fff'}}>SOS</Text></Pressable></View>
    <View style={{flex:1}}>{renderScreen()}</View>
    {refreshing?<Text style={{position:'absolute',bottom:72,right:12,color:colors.muted,fontSize:11}}>Syncing…</Text>:null}
    <View style={{flexDirection:'row',borderTopWidth:1,borderColor:colors.line,backgroundColor:colors.surface,paddingBottom:4}}>{tabs.map(([id,icon,label])=><Pressable key={id} accessibilityRole="tab" accessibilityState={{selected:tab===id}} onPress={()=>setTab(id)} style={{flex:1,minHeight:58,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:21,color:tab===id?colors.primary:colors.muted}}>{icon}</Text><Text style={{fontSize:11,fontWeight:tab===id?'700':'500',color:tab===id?colors.primary:colors.muted}}>{label}</Text></Pressable>)}</View>
  </SafeAreaView></SafeAreaProvider>;
}
