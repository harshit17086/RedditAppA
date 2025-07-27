import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Header from './src/components/Header';
import Footer from './src/components/Footer';
import GlobalFeedScreen from './src/screens/GlobalFeedScreen';
import PersonalizedFeedScreen from './src/screens/PersonalizedFeedScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('Global Feed');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Global Feed':
        return <GlobalFeedScreen />;
      case 'Personalized Feed':
        return <PersonalizedFeedScreen />;
      case 'Create Post':
        return <CreatePostScreen />;
      case 'Auth':
        return <AuthScreen />;
      default:
        return <GlobalFeedScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <Header user={user} onSignOut={handleSignOut} />
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
      <Footer activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
