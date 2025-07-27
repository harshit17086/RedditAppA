import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Post {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  user_id: string;
  users?: {
    full_name: string;
    email: string;
  };
}

interface UserInterest {
  id: string;
  tag: string;
}

export default function PersonalizedFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        fetchUserInterests(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserInterests(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserInterests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserInterests(data || []);
      setSelectedTags(data?.map(interest => interest.tag) || []);
    } catch (error) {
      console.error('Error fetching user interests:', error);
    }
  };

  const addUserInterest = async (tag: string) => {
    if (!currentUser || !tag.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_interests')
        .insert({
          user_id: currentUser.id,
          tag: tag.trim().toLowerCase(),
        });

      if (error) throw error;
      await fetchUserInterests(currentUser.id);
      setNewInterest('');
      setShowAddInterest(false);
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  const removeUserInterest = async (tag: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('tag', tag);

      if (error) throw error;
      await fetchUserInterests(currentUser.id);
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const fetchPersonalizedPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // If user has interests and tags are selected, filter by those tags
      if (selectedTags.length > 0) {
        query = query.overlaps('tags', selectedTags);
      } else if (userInterests.length > 0) {
        // If no tags selected but user has interests, show posts with any of their interests
        const interestTags = userInterests.map(interest => interest.tag);
        query = query.overlaps('tags', interestTags);
      } else {
        // Fallback to recent posts
        query = query.gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching personalized posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPersonalizedPosts();
  }, [selectedTags, userInterests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPersonalizedPosts();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={{ marginTop: 16, color: '#6c757d', fontSize: 16 }}>Loading personalized posts...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Interest Tags Filter */}
      <View style={{ 
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
          Your Interests
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {userInterests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={{
                backgroundColor: selectedTags.includes(interest.tag) ? '#FF4500' : '#FFF3E0',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginRight: 8,
                borderWidth: 1,
                borderColor: selectedTags.includes(interest.tag) ? '#FF4500' : '#FFE0B2',
              }}
              onPress={() => toggleTagFilter(interest.tag)}
            >
              <Text style={{ 
                color: selectedTags.includes(interest.tag) ? '#fff' : '#FF4500', 
                fontSize: 12, 
                fontWeight: '500' 
              }}>
                #{interest.tag}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={{
              backgroundColor: '#FFF3E0',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FFE0B2',
            }}
            onPress={() => setShowAddInterest(true)}
          >
            <Text style={{ color: '#FF4500', fontSize: 12, fontWeight: '500' }}>+ Add</Text>
          </TouchableOpacity>
        </ScrollView>

        {showAddInterest && (
          <View style={{ 
            backgroundColor: '#FFF3E0', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TextInput
              placeholder="Enter tag name..."
              value={newInterest}
              onChangeText={setNewInterest}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#FFE0B2',
                borderRadius: 6,
                padding: 8,
                fontSize: 14,
                backgroundColor: '#fff',
              }}
              onSubmitEditing={() => addUserInterest(newInterest)}
            />
            <TouchableOpacity
              style={{ marginLeft: 8, padding: 8 }}
              onPress={() => addUserInterest(newInterest)}
            >
              <Text style={{ color: '#FF4500', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 8, padding: 8 }}
              onPress={() => setShowAddInterest(false)}
            >
              <Text style={{ color: '#6c757d' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF4500']} />
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 16, 
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', flex: 1, lineHeight: 26 }}>
                {item.title}
              </Text>
              {currentUser && item.user_id === currentUser.id && (
                <TouchableOpacity
                  style={{ 
                    backgroundColor: '#FF4500', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 8,
                    elevation: 1,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={{ color: '#4a4a4a', marginBottom: 12, lineHeight: 20, fontSize: 15 }}>
              {item.description}
            </Text>
            
            {item.tags && item.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={{
                    backgroundColor: selectedTags.includes(tag) ? '#FF4500' : '#FFF3E0',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 4,
                  }}>
                    <Text style={{ 
                      color: selectedTags.includes(tag) ? '#fff' : '#FF4500', 
                      fontSize: 12, 
                      fontWeight: '500' 
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FF4500',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                    {getInitials(item.users?.full_name || item.users?.email || 'Anonymous')}
                  </Text>
                </View>
                <Text style={{ color: '#6c757d', fontSize: 14, fontWeight: '500' }}>
                  {item.users?.full_name || item.users?.email || 'Anonymous'}
                </Text>
              </View>
              <Text style={{ color: '#adb5bd', fontSize: 12 }}>
                {formatTimeAgo(item.created_at)}
              </Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FFF3E0',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{ fontSize: 32, color: '#FF4500' }}>⭐</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#1a1a1a', fontWeight: '600', marginBottom: 8 }}>
              No personalized posts found
            </Text>
            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', lineHeight: 20 }}>
              {userInterests.length === 0 
                ? 'Add some interests to see personalized posts!' 
                : 'Try adjusting your tag filters or create some posts with your interests!'}
            </Text>
          </View>
        }
      />
    </View>
  );
}