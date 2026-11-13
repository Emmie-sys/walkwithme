import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StatusBar, Text, View, useColorScheme, type ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from './api';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { WalkScreen } from './screens/WalkScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SafetyScreen } from './screens/SafetyScreen';
import { RidesScreen } from './screens/RidesScreen';
import { TransporterScreen } from './screens/TransporterScreen';
import { subscribeToActivity } from './realtime/walkSocket';
import { AppIcon, type AppIconName } from './components/Icon';
import { palettes, space, ThemeContext, useTheme } from './theme';
import type { Invitation, Notice, User, Walk } from './types';

type Tab='home'|'walk'|'friends'|'activity'|'profile'|'safety'|'rides';
type PrimaryTab='home'|'walk'|'friends'|'activity';
/** App shell owns only navigation and shared remote state; feature behavior stays in screens/services. */
export default function App() {
  const appearance = useColorScheme();
  const scheme = appearance === 'dark' ? 'dark' : 'light';
  const theme = { scheme, colors: palettes[scheme] } as const;
  return <SafeAreaProvider><ThemeContext.Provider value={theme}><AppContent /></ThemeContext.Provider></SafeAreaProvider>;
}

function AppContent() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [user,setUser]=useState<User|null>(null),[tab,setTab]=useState<Tab>('home'),[friends,setFriends]=useState<User[]>([]),[invitations,setInvitations]=useState<Invitation[]>([]),[walk,setWalk]=useState<Walk|null>(null),[refreshing,setRefreshing]=useState(false),[activityRevision,setActivityRevision]=useState(0),[menuOpen,setMenuOpen]=useState(false),[unreadNotices,setUnreadNotices]=useState<Notice[]>([]);
  const refresh=useCallback(async()=>{if(!user)return;setRefreshing(true);try{const [home,active]=await Promise.all([api.home(),api.activeWalk()]);setFriends(home.friends);setInvitations(home.invitations);setWalk(active);}catch(e){Alert.alert('Connection problem',`${String(e)}\n\nCheck the API server and EXPO_PUBLIC_API_URL.`);}finally{setRefreshing(false);}},[user]);
  const refreshBadges=useCallback(async()=>{try{const notices=await api.notices();setUnreadNotices(notices.filter(notice=>!notice.readAt));}catch{/* Badges are a convenience; preserve the current screen if the API is offline. */}},[]);
  useEffect(()=>{if(user?.role!=='transporter')void refresh();},[user,refresh]);
  useEffect(()=>{if(user?.role==='student')void refreshBadges();else setUnreadNotices([]);},[user,activityRevision,refreshBadges]);
  // Polling supplements realtime events so category badges also recover after an interrupted connection.
  useEffect(()=>{if(user?.role!=='student')return;const timer=setInterval(()=>void refreshBadges(),30000);return()=>clearInterval(timer);},[user,refreshBadges]);
  useEffect(()=>{if(user?.role!=='student')return;const unsubscribe=subscribeToActivity(()=>{setActivityRevision(value=>value+1);void refresh();});return()=>{unsubscribe();};},[user,refresh]);
  // A modest polling loop gives two local clients an up-to-date walk without hiding the transport choice.
  useEffect(()=>{if(user?.role!=='student'||!walk)return;const id=setInterval(()=>{api.activeWalk().then(setWalk).catch(()=>{});},12000);return()=>clearInterval(id);},[user,walk?.id]);
  const signedIn=(next:User)=>{setUser(next);setTab('home');};
  const signOut=()=>{api.logout();setUser(null);setWalk(null);setFriends([]);setInvitations([]);setUnreadNotices([]);setMenuOpen(false);};
  const openTab=(next:Tab)=>{setMenuOpen(false);setTab(next);};
  const isFriendNotice=(kind:string)=>kind.startsWith('friend_');
  const isWalkNotice=(kind:string)=>kind.startsWith('walk_')||kind.includes('invitation')||kind.startsWith('participant_')||kind.startsWith('sharing_');
  const badgeCounts={walk:unreadNotices.filter(n=>isWalkNotice(n.kind)).length,friends:unreadNotices.filter(n=>isFriendNotice(n.kind)).length,activity:unreadNotices.length};
  if(!user)return <><StatusBar barStyle={scheme==='dark'?'light-content':'dark-content'}/><SafeAreaView edges={['top','left','right','bottom']} style={{flex:1,backgroundColor:colors.canvas}}><AuthScreen onSignedIn={signedIn}/></SafeAreaView></>;
  if(user.role==='transporter')return <><StatusBar barStyle={scheme==='dark'?'light-content':'dark-content'}/><SafeAreaView edges={['top','left','right','bottom']} style={{flex:1,backgroundColor:colors.canvas}}><TransporterScreen onSignOut={signOut}/></SafeAreaView></>;
  const renderScreen=()=>{
    switch(tab){
      case 'home':return <HomeScreen user={user} friends={friends} invitations={invitations} walk={walk} onNavigate={next=>setTab(next as Tab)}/>;
      case 'walk':return <WalkScreen friends={friends} walk={walk} userId={user.id} onWalkChanged={()=>void refresh()}/>;
      case 'friends':return <FriendsScreen friends={friends} activityRevision={activityRevision} onChanged={()=>void refresh()}/>;
      case 'activity':return <ActivityScreen activityRevision={activityRevision} onJoined={()=>{setTab('walk');void refresh();}} onBadgesChanged={refreshBadges}/>;
      case 'profile':return <ProfileScreen user={user} onSignOut={signOut}/>;
      case 'safety':return <SafetyScreen/>;
      case 'rides':return <RidesScreen/>;
    }
  };
  const tabs:[PrimaryTab, 'home'|'walk'|'friends'|'activity'][]=[['home','home'],['walk','walk'],['friends','friends'],['activity','activity']];
  return <><StatusBar barStyle={scheme==='dark'?'light-content':'dark-content'}/><SafeAreaView edges={['top','left','right']} style={{flex:1,backgroundColor:colors.canvas}}>
    {menuOpen ? <FadeIn style={{flex:1}}><FullPageMenu user={user} onClose={()=>setMenuOpen(false)} onNavigate={openTab} onSignOut={signOut}/></FadeIn> : <>
    <View style={{height:58,paddingHorizontal:space.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:colors.line,backgroundColor:colors.surface}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:9}}><AppIcon name="brand" color={colors.primary} size={22}/><Text style={{fontSize:17,fontWeight:'800',color:colors.ink}}>Walk with Me</Text></View>
      <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <Pressable accessibilityRole="button" accessibilityLabel="Emergency support" onPress={()=>{void api.sos().catch(()=>{});Alert.alert('SOS recorded','This records a local safety event only. No responder is notified. Choose a verified emergency contact to open your phone dialer.',[{text:'Open safety contacts',onPress:()=>setTab('safety')},{text:'Close',style:'cancel'}]);}} style={({pressed})=>[{backgroundColor:colors.danger,borderRadius:99,paddingHorizontal:14,paddingVertical:9},pressed&&{opacity:0.82,transform:[{scale:0.97}]}]}><Text style={{fontWeight:'800',color:colors.onPrimary}}>SOS</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open account menu" accessibilityState={{expanded:menuOpen}} onPress={()=>setMenuOpen(true)} style={({pressed})=>[{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:colors.canvas,borderWidth:1,borderColor:colors.line},pressed&&{opacity:0.75,transform:[{scale:0.94}]}]}><AppIcon name="more" color={colors.ink}/></Pressable>
      </View>
    </View>
    <FadeIn key={tab} style={{flex:1}}>{renderScreen()}</FadeIn>
    {refreshing?<Text style={{position:'absolute',bottom:76,right:12,color:colors.muted,fontSize:11}}>Syncing…</Text>:null}
    <View style={{flexDirection:'row',borderTopWidth:1,borderColor:colors.line,backgroundColor:colors.surface,paddingBottom:Math.max(insets.bottom,8)}}>{tabs.map(([id,icon])=>{const count=id==='home'?0:badgeCounts[id];return <Pressable key={id} accessibilityRole="tab" accessibilityState={{selected:tab===id}} accessibilityLabel={`${id}, ${count?`${count} unread notifications`:''}`} onPress={()=>setTab(id)} style={{flex:1,minHeight:58,alignItems:'center',justifyContent:'center',gap:3}}><View style={{position:'relative'}}><AppIcon name={icon} size={22} color={tab===id?colors.primary:colors.muted}/>{count>0?<View style={{position:'absolute',top:-7,right:-12,minWidth:17,height:17,paddingHorizontal:4,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:colors.danger,borderWidth:1.5,borderColor:colors.surface}}><Text style={{fontSize:9,fontWeight:'800',color:colors.onPrimary}}>{count>9?'9+':count}</Text></View>:null}</View><Text style={{fontSize:11,fontWeight:tab===id?'700':'500',color:tab===id?colors.primary:colors.muted}}>{id[0].toUpperCase()+id.slice(1)}</Text></Pressable>;})}</View>
    </>}
  </SafeAreaView></>;
}

function FullPageMenu({user,onClose,onNavigate,onSignOut}:{user:User;onClose:()=>void;onNavigate:(tab:Tab)=>void;onSignOut:()=>void}) {
  const {colors}=useTheme();
  const insets=useSafeAreaInsets();
  const items:[string,string,AppIconName,Tab][]=[
    ['Profile & account','Account details, privacy and notification preferences.','profile','profile'],
    ['Trusted friends','Manage friend requests and your walking circle.','friends','friends'],
    ['Notifications & activity','Review walk invitations, alerts and recent walks.','activity','activity'],
    ['Current walk','Open or set up a shared walk.','walk','walk'],
    ['Safety & safe spots','Emergency contacts, verified help points and safety reports.','safety','safety'],
    ['Campus rides','Request a verified transport partner.','ride','rides'],
  ];
  return <View style={{flex:1,backgroundColor:colors.canvas}}>
    <View style={{height:58,paddingHorizontal:space.lg,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:colors.line,backgroundColor:colors.surface}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}><AppIcon name="brand" color={colors.primary}/><Text style={{fontSize:20,fontWeight:'800',color:colors.ink}}>Menu</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:21,backgroundColor:colors.canvas}}><AppIcon name="close" color={colors.ink}/></Pressable>
    </View>
    <ScrollView contentContainerStyle={{padding:space.lg,paddingBottom:Math.max(insets.bottom,space.xl)}}>
      <Text style={{fontSize:22,fontWeight:'800',color:colors.ink}}>Hello, {user.name.split(' ')[0]}</Text>
      <Text style={{fontSize:14,color:colors.muted,marginTop:4,marginBottom:space.lg}}>{user.email}</Text>
      {items.map(([title,description,icon,destination])=><Pressable key={title} accessibilityRole="button" onPress={()=>onNavigate(destination)} style={{minHeight:76,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:space.md,marginBottom:space.sm,borderWidth:1,borderColor:colors.line,borderRadius:16,backgroundColor:colors.surface}}><View style={{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.primarySoft}}><AppIcon name={icon} color={colors.primary}/></View><View style={{flex:1}}><Text style={{fontSize:15,fontWeight:'700',color:colors.ink}}>{title}</Text><Text style={{fontSize:12,color:colors.muted,marginTop:3}}>{description}</Text></View><Text style={{fontSize:21,color:colors.muted}}>›</Text></Pressable>)}
      <Pressable accessibilityRole="button" onPress={()=>Alert.alert('Help & emergency information','This local development build does not contact campus security or emergency services. For immediate danger, use your local emergency number or contact campus security directly.')} style={{minHeight:64,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:space.md,borderBottomWidth:1,borderColor:colors.line}}><AppIcon name="help" color={colors.primary}/><View style={{flex:1}}><Text style={{fontSize:15,fontWeight:'700',color:colors.ink}}>Help & emergency information</Text><Text style={{fontSize:12,color:colors.muted,marginTop:3}}>Learn what this app can and cannot do</Text></View><Text style={{fontSize:21,color:colors.muted}}>›</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>Alert.alert('Walk with Me','Gulu University student walking coordination. This build is running in local development mode.')} style={{minHeight:58,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:space.md,borderBottomWidth:1,borderColor:colors.line}}><AppIcon name="brand" color={colors.muted}/><Text style={{flex:1,fontSize:15,fontWeight:'600',color:colors.ink}}>About Walk with Me</Text><Text style={{fontSize:21,color:colors.muted}}>›</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onSignOut} style={{minHeight:58,justifyContent:'center',paddingHorizontal:space.md,marginTop:space.md}}><Text style={{fontSize:15,fontWeight:'700',color:colors.danger}}>Sign out</Text></Pressable>
    </ScrollView>
  </View>;
}

/** Brief fade and lift keeps tab and full-page menu transitions calm and intentional. */
function FadeIn({children,style}:{children:React.ReactNode;style?:ViewStyle}) {
  const progress=useRef(new Animated.Value(0)).current;
  useEffect(()=>{const animation=Animated.timing(progress,{toValue:1,duration:220,useNativeDriver:true});animation.start();return()=>animation.stop();},[progress]);
  const translateY=progress.interpolate({inputRange:[0,1],outputRange:[8,0]});
  return <Animated.View style={[style,{opacity:progress,transform:[{translateY}]}]}>{children}</Animated.View>;
}
