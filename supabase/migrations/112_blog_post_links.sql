-- Links attached to a blog post (teacher, student, page, or image)
-- Requires: 104_blog_system.sql must be applied first (creates blog_posts table).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    RAISE EXCEPTION 'Run migration 104_blog_system.sql first to create the blog_posts table.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS blog_post_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('teacher', 'student', 'page', 'image')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_post_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog post links viewable with post" ON blog_post_links;
CREATE POLICY "Blog post links viewable with post"
  ON blog_post_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manages blog post links" ON blog_post_links;
CREATE POLICY "Admin manages blog post links"
  ON blog_post_links FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX IF NOT EXISTS idx_blog_post_links_post ON blog_post_links(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_links_order ON blog_post_links(blog_post_id, display_order);
