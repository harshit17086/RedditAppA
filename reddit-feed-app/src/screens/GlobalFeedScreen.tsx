import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Post {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url?: string;
  created_at: string;
  user_id: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export default function GlobalFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPopularTags = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;
      
      // Count tag frequency
      const tagCount: { [key: string]: number } = {};
      data?.forEach(post => {
        post.tags?.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      // Get top 10 most popular tags
      const sortedTags = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      setPopularTags(sortedTags);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const fetchPosts = async () => {
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

      // If tags are selected, filter by those tags
      if (selectedTags.length > 0) {
        query = query.overlaps('tags', selectedTags);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchPopularTags();
  }, [selectedTags]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
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
        <Text style={{ marginTop: 16, color: '#6c757d', fontSize: 16 }}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Tag Filters */}
      <View style={{ 
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
          Filter by Tags
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {popularTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={{
                backgroundColor: selectedTags.includes(tag) ? '#FF4500' : '#FFF3E0',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginRight: 8,
                borderWidth: 1,
                borderColor: selectedTags.includes(tag) ? '#FF4500' : '#FFE0B2',
              }}
              onPress={() => toggleTagFilter(tag)}
            >
              <Text style={{ 
                color: selectedTags.includes(tag) ? '#fff' : '#FF4500', 
                fontSize: 12, 
                fontWeight: '500' 
              }}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
          
          {selectedTags.length > 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: '#6c757d',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#6c757d',
              }}
              onPress={() => setSelectedTags([])}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>Clear All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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

            {/* Image Display */}
            {item.image_url && (
              <View style={{ marginBottom: 16 }}>
                <Image 
                  source={{ uri: item.image_url }} 
                  style={{ 
                    width: '100%', 
                    height: 200, 
                    borderRadius: 12,
                    backgroundColor: '#f8f9fa',
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
            
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
              <Text style={{ fontSize: 32, color: '#FF4500' }}>📝</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#1a1a1a', fontWeight: '600', marginBottom: 8 }}>
              {selectedTags.length > 0 ? 'No posts found' : 'No posts yet'}
            </Text>
            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', lineHeight: 20 }}>
              {selectedTags.length > 0 
                ? 'Try adjusting your tag filters or create posts with those tags!' 
                : 'Be the first to create a post and start the conversation!'}
            </Text>
          </View>
        }
      />
    </View>
  );
} 