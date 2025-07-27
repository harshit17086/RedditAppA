import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'redditfeedapp',
        path: 'auth/callback'
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          Alert.alert(
            'Google Sign-In Not Configured', 
            'Please enable Google OAuth in your Supabase project settings.'
          );
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      Alert.alert('Sign in error', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 32, 
        width: '100%', 
        maxWidth: 400, 
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FF4500',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            elevation: 2,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 32 }}>R</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF4500', marginBottom: 8 }}>Welcome to Reddit Feed</Text>
          <Text style={{ fontSize: 16, color: '#6c757d', textAlign: 'center', lineHeight: 24 }}>
            Sign in to create posts, view feeds, and join the community
          </Text>
        </View>
        
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: '#FF4500',
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 24,
            elevation: 2,
            shadowColor: '#FF4500',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png' }} 
            style={{ width: 24, height: 24, marginRight: 12 }} 
          />
          <Text style={{ fontSize: 16, color: '#FF4500', fontWeight: '600' }}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
          {loading && <ActivityIndicator style={{ marginLeft: 12 }} size="small" color="#FF4500" />}
        </TouchableOpacity>
        
        <Text style={{ 
          fontSize: 12, 
          color: '#adb5bd', 
          textAlign: 'center', 
          marginTop: 24,
          lineHeight: 18,
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}