CREATE TABLE hidden_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, blog_post_id)
);

ALTER TABLE hidden_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own hidden articles"
  ON hidden_articles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own hidden articles"
  ON hidden_articles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own hidden articles"
  ON hidden_articles FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX idx_hidden_articles_user ON hidden_articles (user_id);

REVOKE ALL ON hidden_articles FROM anon;
