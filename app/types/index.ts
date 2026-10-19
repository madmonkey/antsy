export interface Topic {
  id: string
  name: string
  slug: string
  description: string
  is_active: boolean
  is_previewable: boolean
  published_at: string | null
}

export interface Article {
  id: string
  topic_id: string
  title: string
  slug: string
  excerpt: string
  body: string
  tags: string[]
  comments_enabled: boolean
  cover_image: string | null
  is_active: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  published_at: string | null
}

export interface SearchResult extends ArticleSummary {
  topic_name: string
  topic_slug: string
}

export interface Comment {
  id: string
  author_name: string
  body: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  user_id?: string
}

export interface CommenterProfile {
  user_id: string
  display_name: string
  is_blocked: boolean
}

export interface PreviewArticle extends ArticleSummary {
  topic: { name: string, slug: string }
}
