import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect } from 'react';

interface FooterProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export default function Footer({ activeTab, onTabPress }: FooterProps) {
  const [animations] = useState(() => 
    Array(4).fill(0).map(() => new Animated.Value(1))
  );

  const tabs = [
    { name: 'Global Feed', key: 'Global Feed', icon: '🌐', color: '#FF6B35' },
    { name: 'Personalized', key: 'Personalized Feed', icon: '⭐', color: '#FFD93D' },
    { name: 'Create', key: 'Create Post', icon: '✏️', color: '#6BCF7F' },
    { name: 'Auth', key: 'Auth', icon: '👤', color: '#4ECDC4' },
  ];

  const handleTabPress = (tabKey: string, index: number) => {
    // Animate the pressed tab
    Animated.sequence([
      Animated.timing(animations[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onTabPress(tabKey);
  };

  return (
    <View style={{
      backgroundColor: '#ffffff',
      paddingTop: 16,
      paddingBottom: 34,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <Animated.View
              key={tab.key}
              style={{
                transform: [{ scale: animations[index] }],
              }}
            >
              <TouchableOpacity
                onPress={() => handleTabPress(tab.key, index)}
                style={{
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isActive ? tab.color + '15' : 'transparent',
                  borderWidth: isActive ? 2 : 0,
                  borderColor: isActive ? tab.color : 'transparent',
                  minWidth: 70,
                  elevation: isActive ? 4 : 0,
                  shadowColor: isActive ? tab.color : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0,
                  shadowRadius: 4,
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isActive ? tab.color : '#f8f9fa',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                  elevation: isActive ? 2 : 0,
                  shadowColor: isActive ? tab.color : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isActive ? 0.4 : 0,
                  shadowRadius: 2,
                }}>
                  <Text style={{ 
                    fontSize: 18,
                    opacity: isActive ? 1 : 0.7,
                  }}>
                    {tab.icon}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? tab.color : '#8e9aaf',
                  textAlign: 'center',
                  letterSpacing: 0.5,
                }}>
                  {tab.name}
                </Text>
                {isActive && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: tab.color,
                  }} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
} 