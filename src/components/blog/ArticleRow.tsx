import { Link } from 'react-router-dom';
import BlogPostCard, { type BlogPostCardTone } from './BlogPostCard';
import type { BlogPost } from '@/types/blogTypes';

interface ArticleRowProps {
  title: string;
  posts: (BlogPost & { matchedPlants?: string[] })[];
  viewAllTo?: string;
  /** Tones to cycle through, one per card. Defaults to plain surface cards. */
  tones?: BlogPostCardTone[];
  testId?: string;
  /** Cap on cards shown here; "View all" covers the rest */
  limit?: number;
}

/**
 * A titled row of article cards: swipeable on phones, a four-up grid on desktop.
 */
const ArticleRow = ({
  title,
  posts,
  viewAllTo,
  tones = ['surface'],
  testId,
  limit = 8,
}: ArticleRowProps) => (
  <section data-testid={testId}>
    <div className="flex items-baseline justify-between px-1.5 lg:px-0">
      <h2 className="font-display text-lg lg:text-[22px] font-bold tracking-[-0.03em] text-foreground">
        {title}
      </h2>
      {viewAllTo && (
        <Link to={viewAllTo} className="text-sm font-bold text-link">
          See all
        </Link>
      )}
    </div>
    <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 px-4 mt-3 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-3.5 lg:overflow-visible">
      {posts.slice(0, limit).map((post, i) => (
        <div key={post.id} className="flex-none w-[200px] sm:w-[240px] lg:w-auto snap-start">
          <BlogPostCard
            post={post}
            matchedPlants={post.matchedPlants}
            tone={tones[i % tones.length]}
          />
        </div>
      ))}
    </div>
  </section>
);

export default ArticleRow;
