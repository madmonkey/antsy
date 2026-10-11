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
  published_at: string | null
}

export interface PreviewArticle extends ArticleSummary {
  topic: { name: string, slug: string }
}
