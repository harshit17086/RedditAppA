import { View, Text, TouchableOpacity } from 'react-native';

interface FooterProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export default function Footer({ activeTab, onTabPress }: FooterProps) {
  const tabs = [
    { name: 'Global Feed', key: 'Global Feed', icon: '🌐' },
    { name: 'Personalized', key: 'Personalized Feed', icon: '⭐' },
    { name: 'Create', key: 'Create Post', icon: '✏️' },
    { name: 'Auth', key: 'Auth', icon: '👤' },
  ];

  return (
    <View style={{
      backgroundColor: '#fff',
      paddingTop: 12,
      paddingBottom: 30,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={{
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: activeTab === tab.key ? '#FFF3E0' : 'transparent',
              borderWidth: activeTab === tab.key ? 1 : 0,
              borderColor: activeTab === tab.key ? '#FF4500' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: activeTab === tab.key ? '600' : '400',
              color: activeTab === tab.key ? '#FF4500' : '#6c757d',
            }}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 