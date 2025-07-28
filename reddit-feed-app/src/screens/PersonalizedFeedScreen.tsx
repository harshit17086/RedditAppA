import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, TextInput, Image, Animated } from 'react-native';
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
        <ActivityIndicator size="large" color="#FFD93D" />
        <Text style={{ marginTop: 16, color: '#6c757d', fontSize: 16, fontWeight: '500' }}>
          Loading personalized posts...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#f8f9fa', opacity: fadeAnim }}>
      {/* Interest Tags Filter */}
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
          Your Interests
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {userInterests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={{
                backgroundColor: selectedTags.includes(interest.tag) ? '#FFD93D' : '#FFF8E1',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 12,
                borderWidth: 2,
                borderColor: selectedTags.includes(interest.tag) ? '#FFD93D' : '#FFE082',
                elevation: selectedTags.includes(interest.tag) ? 4 : 2,
                shadowColor: selectedTags.includes(interest.tag) ? '#FFD93D' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedTags.includes(interest.tag) ? 0.3 : 0.1,
                shadowRadius: 4,
              }}
              onPress={() => toggleTagFilter(interest.tag)}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: selectedTags.includes(interest.tag) ? '#fff' : '#FF8F00', 
                fontSize: 14, 
                fontWeight: '600',
                letterSpacing: 0.5,
              }}>
                #{interest.tag}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={{
              backgroundColor: '#FFF8E1',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#FFE082',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            onPress={() => setShowAddInterest(true)}
            activeOpacity={0.8}
          >
            <Text style={{ 
              color: '#FF8F00', 
              fontSize: 14, 
              fontWeight: '600',
              letterSpacing: 0.5,
            }}>
              + Add Interest
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {showAddInterest && (
          <Animated.View 
            style={{ 
              backgroundColor: '#FFF8E1', 
              padding: 16, 
              borderRadius: 16, 
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 4,
              shadowColor: '#FFD93D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
          >
            <TextInput
              placeholder="Enter tag name..."
              value={newInterest}
              onChangeText={setNewInterest}
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor: '#FFE082',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                backgroundColor: '#fff',
                fontWeight: '500',
              }}
              onSubmitEditing={() => addUserInterest(newInterest)}
              placeholderTextColor="#adb5bd"
            />
            <TouchableOpacity
              style={{ 
                marginLeft: 12, 
                padding: 12,
                backgroundColor: '#FFD93D',
                borderRadius: 12,
                elevation: 2,
              }}
              onPress={() => addUserInterest(newInterest)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 8, padding: 12 }}
              onPress={() => setShowAddInterest(false)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#6c757d', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFD93D']} />
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
                    backgroundColor: '#FFD93D', 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 12,
                    elevation: 3,
                    shadowColor: '#FFD93D',
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
                    backgroundColor: selectedTags.includes(tag) ? '#FFD93D' : '#FFF8E1',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    marginRight: 8,
                    marginBottom: 8,
                    elevation: 2,
                    shadowColor: selectedTags.includes(tag) ? '#FFD93D' : '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: selectedTags.includes(tag) ? 0.3 : 0.1,
                    shadowRadius: 2,
                  }}>
                    <Text style={{ 
                      color: selectedTags.includes(tag) ? '#fff' : '#FF8F00', 
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
              backgroundColor: '#FFF8E1',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32,
              elevation: 6,
              shadowColor: '#FFD93D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              opacity: fadeAnim,
            }}>
              <Text style={{ fontSize: 40, color: '#FFD93D' }}>⭐</Text>
            </Animated.View>
            <Text style={{ 
              fontSize: 20, 
              color: '#1a1a1a', 
              fontWeight: '700', 
              marginBottom: 12,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}>
              No personalized posts found
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: '#6c757d', 
              textAlign: 'center', 
              lineHeight: 24,
              maxWidth: 280,
            }}>
              {userInterests.length === 0 
                ? 'Add some interests to see personalized posts!' 
                : 'Try adjusting your tag filters or create some posts with your interests!'}
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
}