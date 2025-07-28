import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Animated } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    <View style={{ 
      flex: 1, 
      backgroundColor: '#f8f9fa', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24 
    }}>
      <Animated.View 
        style={{ 
          backgroundColor: '#fff', 
          borderRadius: 24, 
          padding: 40, 
          width: '100%', 
          maxWidth: 400, 
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Animated.View 
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#FF6B35',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32,
              elevation: 6,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 40 }}>R</Text>
          </Animated.View>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#FF6B35', 
            marginBottom: 12,
            textAlign: 'center',
          }}>
            Welcome to Reddit Feed
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6c757d', 
            textAlign: 'center', 
            lineHeight: 24,
            maxWidth: 280,
          }}>
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
            borderColor: '#FF6B35',
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 24,
            elevation: 4,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            marginBottom: 24,
          }}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png' }} 
            style={{ width: 28, height: 28, marginRight: 16 }} 
          />
          <Text style={{ fontSize: 18, color: '#FF6B35', fontWeight: '600' }}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
          {loading && <ActivityIndicator style={{ marginLeft: 16 }} size="small" color="#FF6B35" />}
        </TouchableOpacity>
        
        <View style={{ 
          backgroundColor: '#f8f9fa', 
          padding: 16, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e9ecef',
        }}>
          <Text style={{ 
            fontSize: 12, 
            color: '#8e9aaf', 
            textAlign: 'center', 
            lineHeight: 18,
            fontWeight: '500',
          }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Decorative elements */}
        <View style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#FFD93D',
          opacity: 0.1,
        }} />
        <View style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#4ECDC4',
          opacity: 0.1,
        }} />
      </Animated.View>
    </View>
  );
}