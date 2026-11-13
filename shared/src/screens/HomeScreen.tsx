import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Muted, Pill, useUi } from '../components/ui';
import { PhotoHeader, PhotoHeading } from '../components/PhotoHeader';
import { campusPhoto } from '../assets/photos';
import { findLandmark } from '../data/landmarks';
import { space, useTheme } from '../theme';
import type { Invitation, User, Walk } from '../types';

export function HomeScreen({user,friends,invitations,walk,onNavigate}:{user:User;friends:User[];invitations:Invitation[];walk:Walk|null;onNavigate:(tab:string)=>void}) {
  const ui = useUi();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={{paddingBottom:40}}>
    <PhotoHeader source={campusPhoto.source} credit={campusPhoto.credit}><PhotoHeading subtitle="Your campus walks, coordinated with friends.">Hello, {user.name.split(' ')[0]}</PhotoHeading></PhotoHeader>
    <View style={{padding:space.lg}}>
    <Card style={{backgroundColor:colors.primary,borderColor:colors.primary}}><Text style={{color:colors.onPrimary,fontSize:21,fontWeight:'800'}}>{walk?'Your walk is active':'Heading somewhere?'}</Text><Text style={{color:colors.onPrimary,opacity:0.86,marginTop:6}}>{walk?`To ${findLandmark(walk.destinationId)?.name??'your destination'}`:'Start a walk and invite trusted friends.'}</Text><Button title={walk?'Open active walk':'Start a walk'} onPress={()=>onNavigate('walk')} variant="secondary" style={{marginTop:14}}/></Card>
    {invitations.length>0?<Card><Text style={ui.personName}>Walk invitations</Text><Muted>{invitations.length} waiting for your response</Muted><Button title="Review invitations" onPress={()=>onNavigate('activity')}/></Card>:null}
    <Text style={[ui.personName,ui.section]}>Friends</Text>
    {friends.slice(0,4).map(friend=><Card key={friend.id} style={{marginVertical:4}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Text style={ui.personName}>{friend.name}</Text><Muted>Availability: {friend.availability}</Muted></View><Pill>{friend.availability}</Pill></View></Card>)}
    {friends.length===0?<Card><Muted>Add a trusted friend to coordinate a walk.</Muted></Card>:null}
    <Button title="Manage friends" variant="secondary" onPress={()=>onNavigate('friends')}/>
    <Card><Text style={ui.personName}>A safer walk starts with a check-in</Text><Muted>Choose a destination, share only with invited friends, and stop sharing when you end your walk. This local build does not contact campus security or emergency services.</Muted></Card>
    </View>
  </ScrollView>;
}
