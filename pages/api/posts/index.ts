import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

function parseImageUrls(field: any) {
  if (!field) return []
  if (Array.isArray(field)) return field
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

function serializePost(post: any) {
  return {
    id: post.id,
    title: post.title || post.content || 'PulseWire story',
    excerpt: post.excerpt || post.content || 'PulseWire story',
    category: post.category || 'Technology',
    authorName: post.author_name || post.authorName || 'PulseWire user',
    authorEmail: post.author_email || post.authorEmail || null,
    imageUrls: parseImageUrls(post.image_urls || post.imageUrls || post.image_urls),
    likesCount: post.likes_count || post.likesCount || 0,
    commentsCount: post.comments_count || post.commentsCount || 0,
    sharesCount: post.shares_count || post.sharesCount || 0,
    createdAt: post.created_at || post.createdAt,
    comments: [],
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured yet.' })
  }

  if (req.method === 'GET') {
    try {
      const { authorEmail } = req.query
      const query = supabaseAdmin.from('posts').select('*').order('created_at', { ascending: false })
      const { data, error } = authorEmail ? await query.eq('author_email', String(authorEmail)) : await query

      if (error) throw error

      const posts = (data || []).map((post: any) => serializePost(post))
      return res.status(200).json({ posts })
    } catch (error: any) {
      console.error('Failed to load posts:', error)
      return res.status(500).json({ error: error?.message || 'Unable to load posts' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      const title = String(body.title || body.content || '').trim()
      const excerpt = String(body.excerpt || body.content || '').trim()
      const category = String(body.category || 'Technology').trim()
      const authorEmail = body.authorEmail ? String(body.authorEmail).trim() : null
      const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : ''

      if (!title && !excerpt) {
        return res.status(400).json({ error: 'title or content is required' })
      }

      // Build a safe payload for insertion that excludes optional columns which
      // may not exist in older DB schemas. We'll synthesize title/excerpt/category
      // in the API response using the inserted data.
      const contentValue = `${title || excerpt}\n\n${excerpt || title}`.trim()
      const payloadInsert: any = {
        author_email: authorEmail,
        author_name: authorEmail ? authorEmail.split('@')[0] : 'PulseWire user',
        content: contentValue,
        image_urls: imageUrl ? JSON.stringify([imageUrl]) : '[]',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Attempt insert, and if it fails due to missing columns in the DB schema,
      // remove those columns from the payload and retry (up to a few attempts).
      let data: any = null
      let error: any = null
      const maxRetries = 3
      let attempt = 0
      let currentPayload: any = { ...payloadInsert }

      while (attempt < maxRetries) {
        attempt += 1
        try {
          const res = await supabaseAdmin.from('posts').insert(currentPayload).select('*').single()
          data = res.data
          error = res.error
        } catch (err: any) {
          error = err
        }

        if (!error) break

        const msg = String(error?.message || error?.toString() || '').toLowerCase()
        // Try to extract missing column name patterns
        const missingCols: string[] = []
        const colMatchDouble = msg.match(/column \"([a-z0-9_]+)\"/i)
        const colMatchSingle = msg.match(/column '([a-z0-9_]+)'/i)
        const couldNotFind = msg.match(/could not find the '([a-z0-9_]+)' column/i)
        if (colMatchDouble) missingCols.push(colMatchDouble[1])
        if (colMatchSingle) missingCols.push(colMatchSingle[1])
        if (couldNotFind) missingCols.push(couldNotFind[1])

        if (missingCols.length === 0) {
          // if we can't determine a missing column, stop retrying
          break
        }

        // Remove any detected missing columns from payload (try snake_case and camelCase keys)
        for (const col of missingCols) {
          // remove snake_case
          if (col in currentPayload) delete currentPayload[col]
          // remove camelCase variant
          const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
          if (camel in currentPayload) delete currentPayload[camel]
          // also handle common variants
          if (col === 'image_urls' && 'imageUrls' in currentPayload) delete currentPayload.imageUrls
        }

        // continue loop to retry
      }

      if (error) throw error

      // Ensure we return a post object with title/excerpt/category synthesized
      const createdRow = data || {}
      const returnedPost = serializePost({
        ...createdRow,
        // prefer DB returned values if present; otherwise use the original values
        title: createdRow.title || title || undefined,
        excerpt: createdRow.excerpt || excerpt || undefined,
        category: createdRow.category || category || undefined,
      })

      return res.status(201).json({ post: returnedPost })
    } catch (error: any) {
      console.error('Failed to create post:', error)
      return res.status(500).json({ error: error?.message || 'Unable to create post' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
