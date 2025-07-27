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

  // Function to create or update user profile
  const createUserProfile = async (user: User) => {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing user:', fetchError);
        return;
      }

      // If user doesn't exist, create new profile
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('New user profile created successfully');
        }
      } else {
        //if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user profile:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        createUserProfile(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      // Handle user creation/update on sign in
      if (event === 'SIGNED_IN' && session?.user) {
        await createUserProfile(session.user);
      }
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
