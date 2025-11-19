import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

const STORAGE_BUCKET = 'recipe-images';
const MAX_WIDTH = 800;
const COMPRESS_QUALITY = 0.8;

/**
 * Uploads a recipe image to Supabase Storage
 *
 * @param imageUri - Local file URI from ImagePicker
 * @param userId - User ID for organizing storage
 * @returns Promise<{ imageUrl: string; imagePath: string }> - Public URL and storage path
 * @throws Error if upload fails
 */
export async function uploadRecipeImage(
  imageUri: string,
  userId: string
): Promise<{ imageUrl: string; imagePath: string }> {
  try {
    console.log('Starting image upload for user:', userId);

    // Step 1: Compress and resize the image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image compressed:', {
      originalUri: imageUri,
      compressedUri: manipulatedImage.uri,
      width: manipulatedImage.width,
      height: manipulatedImage.height,
    });

    // Step 2: Read the compressed image as base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: 'base64',
    });

    console.log('Image read as base64, length:', base64.length);

    // Step 3: Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Step 4: Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomId}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to storage:', { bucket: STORAGE_BUCKET, filePath });

    // Step 5: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from storage upload');
    }

    // Step 6: Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('Image uploaded successfully:', {
      path: filePath,
      url: urlData.publicUrl,
    });

    return {
      imageUrl: urlData.publicUrl,
      imagePath: filePath,
    };
  } catch (error) {
    console.error('Error uploading recipe image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload recipe image: Unknown error');
  }
}

/**
 * Deletes a recipe image from Supabase Storage
 *
 * @param imagePath - Storage path of the image (e.g., "userId/timestamp_id.jpg")
 * @returns Promise<void>
 * @throws Error if deletion fails
 */
export async function deleteRecipeImage(imagePath: string): Promise<void> {
  try {
    if (!imagePath) {
      console.warn('No image path provided for deletion');
      return;
    }

    console.log('Deleting image from storage:', imagePath);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([imagePath]);

    if (error) {
      console.error('Storage deletion error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    console.log('Image deleted successfully:', imagePath);
  } catch (error) {
    console.error('Error deleting recipe image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete recipe image: Unknown error');
  }
}

/**
 * Checks if an image exists in storage
 *
 * @param imagePath - Storage path of the image
 * @returns Promise<boolean> - True if image exists
 */
export async function imageExists(imagePath: string): Promise<boolean> {
  try {
    if (!imagePath) return false;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(imagePath.split('/')[0], {
        search: imagePath.split('/')[1],
      });

    if (error) {
      console.error('Error checking image existence:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking if image exists:', error);
    return false;
  }
}
