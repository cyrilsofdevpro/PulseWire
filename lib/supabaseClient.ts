import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()

export async function uploadFileToBucket(file: File, bucket: 'post-images' | 'cover-images' | 'profile-images') {
  if (!supabase) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')

  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name || 'upload')}${extension ? `.${extension}` : ''}`

  const { data, error } = await supabase.storage.from(bucket).upload(safeName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) throw error

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(data?.path || safeName).data.publicUrl
  return { path: data?.path || safeName, publicUrl }
}
