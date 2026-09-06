import { supabase } from './supabase/client'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MAX_MEDIA_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'
]

export interface UploadResult {
  url: string | null
  error: Error | null
}

/**
 * Uploads a builder avatar to the 'avatars' bucket in Supabase Storage.
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  try {
    if (!AVATAR_TYPES.includes(file.type)) {
      return { url: null, error: new Error('Please upload a JPG, PNG, or WEBP image.') }
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return { url: null, error: new Error('Avatar image must be 2MB or smaller.') }
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filePath = `${userId}/avatar_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (err: any) {
    console.error('[Storage] Avatar upload error:', err)
    return { url: null, error: err instanceof Error ? err : new Error(String(err.message || err)) }
  }
}

/**
 * Uploads post attachments (image/video/audio) to the 'post-media' bucket.
 */
export async function uploadPostMedia(userId: string, file: File): Promise<UploadResult> {
  try {
    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      return { url: null, error: new Error('Unsupported media file format.') }
    }

    if (file.size > MAX_MEDIA_BYTES) {
      return { url: null, error: new Error('Media file must be 10MB or smaller.') }
    }

    const fileExt = file.name.split('.').pop() || 'bin'
    const filePath = `${userId}/media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (err: any) {
    console.error('[Storage] Post media upload error:', err)
    return { url: null, error: err instanceof Error ? err : new Error(String(err.message || err)) }
  }
}

/**
 * Deletes a file from Supabase storage.
 */
export async function deleteStorageFile(bucket: string, path: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
    return { error: null }
  } catch (err: any) {
    return { error: err instanceof Error ? err : new Error(String(err.message || err)) }
  }
}
