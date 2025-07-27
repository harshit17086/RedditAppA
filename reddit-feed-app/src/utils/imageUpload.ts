import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export const uploadImage = async (uri: string, fileName: string): Promise<string | null> => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated for image upload');
      return null;
    }

    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${user.id}-${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(uniqueFileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      
      // Provide specific error messages
      if (error.message.includes('403') || error.message.includes('Unauthorized')) {
        console.error('Storage access denied. Check storage policies and bucket permissions.');
      } else if (error.message.includes('bucket')) {
        console.error('Bucket not found. Make sure "post-images" bucket exists.');
      }
      
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
}; 