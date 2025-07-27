import { View, Text, TouchableOpacity, Image } from 'react-native';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  onSignOut?: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FF4500',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>R</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF4500' }}>Reddit Feed</Text>
        </View>
        
        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#FF4500',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                {getInitials(user.user_metadata?.full_name || user.email || 'U')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onSignOut}
              style={{
                backgroundColor: '#f8f9fa',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#e9ecef',
              }}
            >
              <Text style={{ color: '#6c757d', fontSize: 12, fontWeight: '500' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
} 