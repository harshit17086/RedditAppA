import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { pickImage, uploadImage } from '../utils/imageUpload';

interface Post {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url?: string;
}

export default function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleImagePick = async () => {
    const imageUri = await pickImage();
    if (imageUri) {
      setSelectedImage(imageUri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('You must be signed in to create a post.');
      const user = userData.user;
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      let imageUrl = null;
      if (selectedImage && !editingPost?.image_url) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedImage, 'post-image.jpg');
        setUploadingImage(false);
      } else if (editingPost?.image_url) {
        imageUrl = editingPost.image_url;
      }

      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title,
            description,
            tags: tagArray,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id)
          .eq('user_id', user.id); // Ensure user owns the post

        if (error) throw error;
        Alert.alert('Success', 'Post updated!');
      } else {
        // Create new post
        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          title,
          description,
          tags: tagArray,
          image_url: imageUrl,
        });
        if (error) throw error;
        Alert.alert('Success', 'Post created!');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedImage(null);
      setEditingPost(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setSelectedImage(null);
    setEditingPost(null);
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={{ 
          backgroundColor: '#fff', 
          borderRadius: 24, 
          padding: 32, 
          width: '100%', 
          maxWidth: 500,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Animated.View 
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#6BCF7F',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              elevation: 6,
              shadowColor: '#6BCF7F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 32 }}>
              {editingPost ? '✏️' : '📝'}
            </Text>
          </Animated.View>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#6BCF7F', 
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {editingPost ? 'Edit Post' : 'Create a Post'}
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6c757d', 
            textAlign: 'center',
            lineHeight: 22,
          }}>
            {editingPost ? 'Update your post content below' : 'Share your thoughts with the community'}
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Title *
          </Text>
          <TextInput
            placeholder="Enter your post title..."
            value={title}
            onChangeText={setTitle}
            style={{ 
              borderWidth: 2, 
              borderColor: '#e9ecef', 
              borderRadius: 16, 
              padding: 18, 
              fontSize: 16,
              backgroundColor: '#f8f9fa',
              fontWeight: '500',
            }}
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Description
          </Text>
          <TextInput
            placeholder="Share your thoughts, ideas, or questions..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ 
              borderWidth: 2, 
              borderColor: '#e9ecef', 
              borderRadius: 16, 
              padding: 18, 
              fontSize: 16, 
              minHeight: 120,
              backgroundColor: '#f8f9fa',
              textAlignVertical: 'top',
              fontWeight: '500',
            }}
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Image (Optional)
          </Text>
          <TouchableOpacity
            onPress={handleImagePick}
            style={{
              borderWidth: 2,
              borderColor: '#e9ecef',
              borderStyle: 'dashed',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <View style={{ alignItems: 'center' }}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={{ 
                    width: 240, 
                    height: 180, 
                    borderRadius: 12, 
                    marginBottom: 12,
                    backgroundColor: '#f8f9fa',
                  }}
                  resizeMode="cover"
                />
                <Text style={{ 
                  color: '#6BCF7F', 
                  fontSize: 16, 
                  fontWeight: '600',
                  letterSpacing: 0.5,
                }}>
                  Tap to change image
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#e9ecef',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 40 }}>📷</Text>
                </View>
                <Text style={{ 
                  color: '#6c757d', 
                  fontSize: 16, 
                  textAlign: 'center',
                  fontWeight: '500',
                  marginBottom: 4,
                }}>
                  Tap to add an image
                </Text>
                <Text style={{ 
                  color: '#adb5bd', 
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  JPG, PNG up to 5MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Tags
          </Text>
          <TextInput
            placeholder="react, javascript, programming (comma separated)"
            value={tags}
            onChangeText={setTags}
            style={{ 
              borderWidth: 2, 
              borderColor: '#e9ecef', 
              borderRadius: 16, 
              padding: 18, 
              fontSize: 16,
              backgroundColor: '#f8f9fa',
              fontWeight: '500',
            }}
            placeholderTextColor="#adb5bd"
          />
          <Text style={{ 
            fontSize: 14, 
            color: '#6c757d', 
            marginTop: 8,
            lineHeight: 20,
          }}>
            Add relevant tags to help others discover your post
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          {editingPost && (
            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: '#6c757d', 
                borderRadius: 16, 
                paddingVertical: 18, 
                alignItems: 'center',
                elevation: 4,
                shadowColor: '#6c757d',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: '#fff', 
                fontWeight: '700', 
                fontSize: 16,
                letterSpacing: 0.5,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ 
              flex: editingPost ? 1 : 1, 
              backgroundColor: '#6BCF7F', 
              borderRadius: 16, 
              paddingVertical: 18, 
              alignItems: 'center', 
              opacity: loading ? 0.7 : 1,
              elevation: 6,
              shadowColor: '#6BCF7F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={{ 
              color: '#fff', 
              fontWeight: '700', 
              fontSize: 16,
              letterSpacing: 0.5,
            }}>
              {loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
            </Text>
            {(loading || uploadingImage) && (
              <ActivityIndicator 
                style={{ marginLeft: 12 }} 
                size="small" 
                color="#fff" 
              />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}