import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Label } from '../components/ui';
import { PhotoHeader, PhotoHeading } from '../components/PhotoHeader';
import { studentPhoto } from '../assets/photos';
import { AppIcon } from '../components/Icon';
import { space, useTheme } from '../theme';
import type { User } from '../types';

export function AuthScreen({onSignedIn}:{onSignedIn:(user:User)=>void}) {
  const { colors } = useTheme();
  const [register,setRegister]=useState(false),[name,setName]=useState(''),[studentId,setStudentId]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[passwordVisible,setPasswordVisible]=useState(false),[confirmVisible,setConfirmVisible]=useState(false),[busy,setBusy]=useState(false);
  const submit=async()=>{if(register&&password!==confirmPassword){Alert.alert('Passwords do not match','Re-enter the same password in both fields.');return;}setBusy(true);try{const user=register?await api.register({name,email,studentId,password}):await api.login(email,password);onSignedIn(user);}catch(e){Alert.alert('Could not continue',e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}};
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>
  <ScrollView contentContainerStyle={{flexGrow:1,paddingBottom:space.xl,backgroundColor:colors.canvas}} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS==='ios'?'interactive':'on-drag'}>
    <PhotoHeader source={studentPhoto.source} credit={studentPhoto.credit}><PhotoHeading>Walk with Me</PhotoHeading></PhotoHeader>
    <View style={{paddingHorizontal:space.lg,marginTop:-space.md}}>
    <Card><Text style={{fontSize:19,fontWeight:'800',color:colors.ink}}>{register?'Create account':'Sign in'}</Text>
      {register?<><Label>Full name</Label><Field value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words"/><Label>Student ID</Label><Field value={studentId} onChangeText={setStudentId} placeholder="Student ID"/></>:null}
      <Label>University email</Label><Field value={email} onChangeText={setEmail} placeholder="name@gu.ac.ug" autoCapitalize="none" keyboardType="email-address"/>
      <Label>Password</Label><View style={{position:'relative',justifyContent:'center'}}><Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!passwordVisible} style={{paddingRight:52}}/><Pressable accessibilityRole="button" accessibilityLabel={passwordVisible?'Hide password':'Show password'} accessibilityState={{selected:passwordVisible}} hitSlop={8} onPress={()=>setPasswordVisible(visible=>!visible)} style={{position:'absolute',right:8,width:40,height:40,alignItems:'center',justifyContent:'center'}}><AppIcon name={passwordVisible?'eyeOff':'eye'} color={colors.muted} size={21}/></Pressable></View>
      {register?<><Label>Confirm password</Label><View style={{position:'relative',justifyContent:'center'}}><Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry={!confirmVisible} style={{paddingRight:52}}/><Pressable accessibilityRole="button" accessibilityLabel={confirmVisible?'Hide password':'Show password'} accessibilityState={{selected:confirmVisible}} hitSlop={8} onPress={()=>setConfirmVisible(visible=>!visible)} style={{position:'absolute',right:8,width:40,height:40,alignItems:'center',justifyContent:'center'}}><AppIcon name={confirmVisible?'eyeOff':'eye'} color={colors.muted} size={21}/></Pressable></View></>:null}
      <Button title={busy?'Please wait…':register?'Create account':'Sign in'} disabled={busy} onPress={submit} style={{marginTop:space.lg}}/>
      <Button title={register?'I already have an account':'Create an account'} variant="quiet" onPress={()=>{setRegister(!register);setPasswordVisible(false);setConfirmVisible(false);}}/>
    </Card>
    </View>
  </ScrollView>
  </KeyboardAvoidingView>;
}
