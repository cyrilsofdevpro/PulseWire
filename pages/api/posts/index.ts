import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { generateWithFallback } from '../../../lib/llm'

const AI_CONFIDENCE_THRESHOLD = Number(process.env.AI_CONFIDENCE_THRESHOLD || '70')
const TRUSTED_POSTS_THRESHOLD = Number(process.env.TRUSTED_POSTS_THRESHOLD || '3')
const AI_PROMPT_OVERRIDE = process.env.AI_VERIFICATION_PROMPT || ''

function parseImageUrls(field: any) {
  if (!field) return []
  if (Array.isArray(field)) return field
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

function serializePostRow(post: any) {
  const content = typeof post.content === 'string' ? post.content : ''
  const contentLines = content.split(/\r?\n/).filter(Boolean)
  const fallbackTitle = contentLines[0] || 'PulseWire story'
  const fallbackExcerpt = contentLines.slice(1).join(' ').trim() || content || 'PulseWire story'

  return {
    id: post.id,
    title: post.title || fallbackTitle,
    excerpt: post.excerpt || fallbackExcerpt,
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

      const postsRaw = data || []

      // Fetch profile badges for authors in bulk to avoid N+1 on the client
      const emails = Array.from(new Set(postsRaw.map((p: any) => p.author_email).filter(Boolean)))
      let profilesMap: Record<string, any> = {}
      if (emails.length && supabaseAdmin) {
        try {
          const { data: profiles } = await supabaseAdmin.from('profiles').select('id,username,email,verification_badge').in('email', emails)
          if (Array.isArray(profiles)) {
            profilesMap = profiles.reduce((acc: any, cur: any) => { acc[cur.email] = cur; return acc }, {})
          }
        } catch (err) {
          console.warn('Could not load author profiles for badge mapping', err)
        }
      }

      const posts = postsRaw.map((post: any) => {
        const serialized = serializePostRow(post)
        const author = post.author_email || serialized.authorEmail || null
        const prof = author ? profilesMap[author] : null
        return {
          ...serialized,
          aiVerified: !!post.ai_verified,
          aiVerification: post.ai_verification ? (() => {
            try { return JSON.parse(post.ai_verification) } catch { return post.ai_verification }
          })() : null,
          authorVerifiedBadge: prof ? !!prof.verification_badge : false,
        }
      })

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
      const authorName = String(body.authorName || body.displayName || body.author || '').trim()
      const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : ''
      const postTitle = String(title || 'PulseWire story').trim()
      const postExcerpt = String(excerpt || 'PulseWire story').trim()
      const postCategory = String(category || 'Technology').trim()

      if (!title && !excerpt) {
        return res.status(400).json({ error: 'title or content is required' })
      }

      // Build a safe payload for insertion that excludes optional columns which
      // may not exist in older DB schemas. We'll synthesize title/excerpt/category
      // in the API response using the inserted data.
      const contentValue = `${postTitle}\n\n${postExcerpt}`.trim()
      const payloadInsert: any = {
        title: postTitle,
        excerpt: postExcerpt,
        category: postCategory,
        author_email: authorEmail,
        author_name: authorName || (authorEmail ? authorEmail.split('@')[0] : 'PulseWire user'),
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
      const returnedPost = {
        id: createdRow.id,
        title: createdRow.title || postTitle || 'PulseWire story',
        excerpt: createdRow.excerpt || postExcerpt || 'PulseWire story',
        category: createdRow.category || postCategory || 'Technology',
        authorName: createdRow.author_name || createdRow.authorName || authorName || (authorEmail ? authorEmail.split('@')[0] : 'PulseWire user'),
        authorEmail: createdRow.author_email || createdRow.authorEmail || authorEmail,
        imageUrls: parseImageUrls(createdRow.image_urls || createdRow.imageUrls || createdRow.image_urls),
        likesCount: createdRow.likes_count || createdRow.likesCount || 0,
        commentsCount: createdRow.comments_count || createdRow.commentsCount || 0,
        sharesCount: createdRow.shares_count || createdRow.sharesCount || 0,
        createdAt: createdRow.created_at || createdRow.createdAt,
        comments: [],
      };

      // Fire-and-forget: run an AI factuality check and attempt to persist results + award badges
      (async () => {
        try {
          const storyText = `${returnedPost.title}\n\n${returnedPost.excerpt || ''}`.trim()
          if (!storyText) return

          // Prompt the LLM to produce a compact JSON assessment
          const defaultPrompt = `Assess the factual accuracy of the following news story. Provide a concise JSON-only response with keys: verified (true/false), confidence (number 0-100), rationale (short string), sources (array of URLs if available). Do not include any extra commentary.\n\nStory:\n${storyText}`
          const prompt = AI_PROMPT_OVERRIDE || defaultPrompt
          const llm = await generateWithFallback(prompt, { task: 'analysis', max_tokens: 300 })
          let parsed: any = null
          if (llm?.text) {
            // Attempt to parse JSON out of the response
            const txt = llm.text.trim()
            try {
              parsed = JSON.parse(txt)
            } catch (err) {
              // Try to extract JSON substring
              const m = txt.match(/\{[\s\S]*\}/)
              if (m) {
                try { parsed = JSON.parse(m[0]) } catch (e) { parsed = { raw: txt } }
              } else {
                parsed = { raw: txt }
              }
            }
          }

          const verified = parsed && typeof parsed.verified === 'boolean' ? parsed.verified : false
          const confidence = parsed && typeof parsed.confidence === 'number' ? parsed.confidence : (parsed && parsed.confidence ? Number(parsed.confidence) : 0)
          const rationale = parsed && (parsed.rationale || parsed.reason || parsed.explanation) ? (parsed.rationale || parsed.reason || parsed.explanation) : (parsed && parsed.raw ? String(parsed.raw).slice(0, 400) : '')
          const sources = parsed && Array.isArray(parsed.sources) ? parsed.sources : (parsed && parsed.source ? [parsed.source] : [])

          // Try to persist verification on the post (ignore failures)
          try {
            if (supabaseAdmin && createdRow.id) {
              await supabaseAdmin.from('posts').update({ ai_verified: verified, ai_verification: JSON.stringify({ confidence, rationale, sources }) }).eq('id', createdRow.id)
            }
          } catch (err) {
            console.warn('Failed to persist AI verification on post', err)
          }

          // If verified with decent confidence, reward the author and consider awarding a badge
          try {
            if (verified && confidence >= AI_CONFIDENCE_THRESHOLD && authorEmail) {
              // find profile by email
              const { data: profile } = await supabaseAdmin!.from('profiles').select('*').eq('email', authorEmail).maybeSingle()
              if (profile) {
                const trustedCount = (profile.trusted_posts_count || 0) + 1
                const updates: any = { trusted_posts_count: trustedCount }
                updates.reputation_score = (profile.reputation_score || 0) + 5
                // award visual verification badge if threshold reached
                if (!profile.verification_badge && trustedCount >= TRUSTED_POSTS_THRESHOLD) {
                  updates.verification_badge = true
                  updates.verified_at = new Date().toISOString()
                  // create a notification entry
                  try {
                    await supabaseAdmin!.from('notifications').insert({ user_id: profile.id, actor_id: null, type: 'badge_awarded', title: 'Trusted poster badge', message: 'You earned the Trusted Poster badge for publishing accurate stories', metadata: { badge: 'Trusted Poster' } })
                  } catch (nerr) {
                    console.warn('Could not create badge notification', nerr)
                  }
                }

                try {
                  await supabaseAdmin!.from('profiles').update(updates).eq('id', profile.id)
                } catch (uperr) {
                  console.warn('Failed to update profile with trusted post count', uperr)
                }
              }
            }
          } catch (err) {
            console.warn('Badge/reputation awarding failed', err)
          }
        } catch (err) {
          console.warn('AI factuality check failed', err)
        }
      })()

      return res.status(201).json({ post: returnedPost })
    } catch (error: any) {
      console.error('Failed to create post:', error)
      return res.status(500).json({ error: error?.message || 'Unable to create post' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
