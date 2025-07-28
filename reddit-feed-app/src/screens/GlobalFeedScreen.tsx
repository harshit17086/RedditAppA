import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

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
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 16, color: '#6c757d', fontSize: 16, fontWeight: '500' }}>
          Loading posts...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#f8f9fa', opacity: fadeAnim }}>
      {/* Tag Filters */}
      <View style={{ 
        backgroundColor: '#fff', 
        paddingHorizontal: 20, 
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#1a1a1a', 
          marginBottom: 16,
          letterSpacing: 0.5,
        }}>
          Filter by Tags
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {popularTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={{
                backgroundColor: selectedTags.includes(tag) ? '#FF6B35' : '#FFF3E0',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 12,
                borderWidth: 2,
                borderColor: selectedTags.includes(tag) ? '#FF6B35' : '#FFE0B2',
                elevation: selectedTags.includes(tag) ? 4 : 2,
                shadowColor: selectedTags.includes(tag) ? '#FF6B35' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedTags.includes(tag) ? 0.3 : 0.1,
                shadowRadius: 4,
              }}
              onPress={() => toggleTagFilter(tag)}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: selectedTags.includes(tag) ? '#fff' : '#FF6B35', 
                fontSize: 14, 
                fontWeight: '600',
                letterSpacing: 0.5,
              }}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
          
          {selectedTags.length > 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: '#6c757d',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: '#6c757d',
                elevation: 3,
                shadowColor: '#6c757d',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
              onPress={() => setSelectedTags([])}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: '600',
                letterSpacing: 0.5,
              }}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => (
          <Animated.View 
            style={{ 
              backgroundColor: '#fff', 
              borderRadius: 20, 
              padding: 24, 
              marginBottom: 20, 
              elevation: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }],
            }}
          >
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: 16 
            }}>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: 'bold', 
                color: '#1a1a1a', 
                flex: 1, 
                lineHeight: 28,
                letterSpacing: 0.5,
              }}>
                {item.title}
              </Text>
              {currentUser && item.user_id === currentUser.id && (
                <TouchableOpacity
                  style={{ 
                    backgroundColor: '#FF6B35', 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 12,
                    elevation: 3,
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={{ 
              color: '#4a4a4a', 
              marginBottom: 16, 
              lineHeight: 22, 
              fontSize: 16,
              fontWeight: '500',
            }}>
              {item.description}
            </Text>

            {/* Image Display */}
            {item.image_url && (
              <View style={{ marginBottom: 20 }}>
                <Image 
                  source={{ uri: item.image_url }} 
                  style={{ 
                    width: '100%', 
                    height: 220, 
                    borderRadius: 16,
                    backgroundColor: '#f8f9fa',
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {item.tags && item.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={{
                    backgroundColor: selectedTags.includes(tag) ? '#FF6B35' : '#FFF3E0',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    marginRight: 8,
                    marginBottom: 8,
                    elevation: 2,
                    shadowColor: selectedTags.includes(tag) ? '#FF6B35' : '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: selectedTags.includes(tag) ? 0.3 : 0.1,
                    shadowRadius: 2,
                  }}>
                    <Text style={{ 
                      color: selectedTags.includes(tag) ? '#fff' : '#FF6B35', 
                      fontSize: 13, 
                      fontWeight: '600',
                      letterSpacing: 0.5,
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
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
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {getInitials(item.users?.full_name || item.users?.email || 'Anonymous')}
                  </Text>
                </View>
                <Text style={{ 
                  color: '#6c757d', 
                  fontSize: 15, 
                  fontWeight: '600',
                  letterSpacing: 0.5,
                }}>
                  {item.users?.full_name || item.users?.email || 'Anonymous'}
                </Text>
              </View>
              <Text style={{ 
                color: '#adb5bd', 
                fontSize: 13, 
                fontWeight: '500',
                letterSpacing: 0.5,
              }}>
                {formatTimeAgo(item.created_at)}
              </Text>
            </View>
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <Animated.View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#FFF3E0',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32,
              elevation: 6,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              opacity: fadeAnim,
            }}>
              <Text style={{ fontSize: 40, color: '#FF6B35' }}>📝</Text>
            </Animated.View>
            <Text style={{ 
              fontSize: 20, 
              color: '#1a1a1a', 
              fontWeight: '700', 
              marginBottom: 12,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}>
              {selectedTags.length > 0 ? 'No posts found' : 'No posts yet'}
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: '#6c757d', 
              textAlign: 'center', 
              lineHeight: 24,
              maxWidth: 280,
            }}>
              {selectedTags.length > 0 
                ? 'Try adjusting your tag filters or create posts with those tags!' 
                : 'Be the first to create a post and start the conversation!'}
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
} 