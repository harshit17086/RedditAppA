import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

interface HeaderProps {
  user: User | null;
  onSignOut?: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onSignOut?.();
  };

  return (
    <Animated.View 
      style={{
        backgroundColor: '#ffffff',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Animated.View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            opacity: fadeAnim,
            transform: [{ translateX: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}],
          }}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#FF6B35',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            elevation: 4,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>R</Text>
          </View>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginBottom: 2 }}>
              Reddit Feed
            </Text>
            <Text style={{ fontSize: 12, color: '#8e9aaf', fontWeight: '500' }}>
              Share • Connect • Discover
            </Text>
          </View>
        </Animated.View>
        
        {user && (
          <Animated.View 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              opacity: fadeAnim,
              transform: [{ translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })}],
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#4ECDC4',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              elevation: 3,
              shadowColor: '#4ECDC4',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {getInitials(user.user_metadata?.full_name || user.email || 'U')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                backgroundColor: '#f8f9fa',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#e9ecef',
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#6c757d', fontSize: 13, fontWeight: '600' }}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
} 