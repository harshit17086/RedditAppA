import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Post {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export default function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

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

      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title,
            description,
            tags: tagArray,
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
        });
        if (error) throw error;
        Alert.alert('Success', 'Post created!');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
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
    setEditingPost(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 20 }}>
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 24, 
        width: '100%', 
        maxWidth: 500,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#FF4500',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>
              {editingPost ? '✏️' : '📝'}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF4500', marginBottom: 4 }}>
            {editingPost ? 'Edit Post' : 'Create a Post'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center' }}>
            {editingPost ? 'Update your post content below' : 'Share your thoughts with the community'}
          </Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
            Title *
          </Text>
          <TextInput
            placeholder="Enter your post title..."
            value={title}
            onChangeText={setTitle}
            style={{ 
              borderWidth: 2, 
              borderColor: '#e9ecef', 
              borderRadius: 12, 
              padding: 16, 
              fontSize: 16,
              backgroundColor: '#f8f9fa',
            }}
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
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
              borderRadius: 12, 
              padding: 16, 
              fontSize: 16, 
              minHeight: 100,
              backgroundColor: '#f8f9fa',
              textAlignVertical: 'top',
            }}
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
            Tags
          </Text>
          <TextInput
            placeholder="react, javascript, programming (comma separated)"
            value={tags}
            onChangeText={setTags}
            style={{ 
              borderWidth: 2, 
              borderColor: '#e9ecef', 
              borderRadius: 12, 
              padding: 16, 
              fontSize: 16,
              backgroundColor: '#f8f9fa',
            }}
            placeholderTextColor="#adb5bd"
          />
          <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
            Add relevant tags to help others discover your post
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {editingPost && (
            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: '#6c757d', 
                borderRadius: 12, 
                paddingVertical: 16, 
                alignItems: 'center',
                elevation: 2,
              }}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ 
              flex: editingPost ? 1 : 1, 
              backgroundColor: '#FF4500', 
              borderRadius: 12, 
              paddingVertical: 16, 
              alignItems: 'center', 
              opacity: loading ? 0.7 : 1,
              elevation: 2,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
            </Text>
            {loading && <ActivityIndicator style={{ marginLeft: 8 }} size="small" color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}