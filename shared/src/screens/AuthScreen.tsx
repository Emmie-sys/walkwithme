import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Label, Muted, Title } from '../components/ui';
import { colors, space } from '../theme';
import type { User } from '../types';

export function AuthScreen({onSignedIn}:{onSignedIn:(user:User)=>void}) {
  const [register,setRegister]=useState(false),[name,setName]=useState(''),[studentId,setStudentId]=useState(''),[email,setEmail]=useState('amina@demo.gu.ac.ug'),[password,setPassword]=useState('Walk1234'),[confirmPassword,setConfirmPassword]=useState(''),[busy,setBusy]=useState(false);
  const submit=async()=>{if(register&&password!==confirmPassword){Alert.alert('Passwords do not match','Re-enter the same password in both fields.');return;}setBusy(true);try{const user=register?await api.register({name,email,studentId,password}):await api.login(email,password);onSignedIn(user);}catch(e){Alert.alert('Could not continue',e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}};
  return <ScrollView contentContainerStyle={{padding:space.lg,paddingTop:54,flexGrow:1,justifyContent:'center',backgroundColor:colors.canvas}} keyboardShouldPersistTaps="handled">
    <Text style={{fontSize:15,color:colors.primary,fontWeight:'800'}}>GULU UNIVERSITY · STUDENT SAFETY</Text>
    <Title subtitle="Coordinate a walk with people you trust. Sharing is optional and only for the duration of a walk.">Walk with Me</Title>
    <Card><Text style={{fontSize:19,fontWeight:'800',color:colors.ink}}>{register?'Create your account':'Welcome back'}</Text>
      {register?<><Label>Full name</Label><Field value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words"/><Label>Student ID</Label><Field value={studentId} onChangeText={setStudentId} placeholder="Student ID"/></>:null}
      <Label>University email</Label><Field value={email} onChangeText={setEmail} placeholder="name@gu.ac.ug" autoCapitalize="none" keyboardType="email-address"/>
      <Label>Password</Label><Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry/>
      {register?<><Label>Confirm password</Label><Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry/><Muted>Use at least 10 characters.</Muted></>:null}
      <Button title={busy?'Please wait…':register?'Create account':'Sign in'} disabled={busy} onPress={submit} style={{marginTop:space.lg}}/>
      <Button title={register?'I already have an account':'Create an account'} variant="quiet" onPress={()=>setRegister(!register)}/>
    </Card>
    <Muted>Local development account: amina@demo.gu.ac.ug · Walk1234. Accounts here are development fixtures and are not university verified.</Muted>
    <View style={{height:8}}/>
  </ScrollView>;
}
