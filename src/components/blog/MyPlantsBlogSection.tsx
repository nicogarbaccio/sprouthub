import { Skeleton } from '@/components/ui/skeleton';
import ArticleRow from './ArticleRow';
import { useMyPlantsBlogPosts } from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';

interface MyPlantsBlogSectionProps {
  plantNames: string[];
}

const MyPlantsBlogSection = ({ plantNames }: MyPlantsBlogSectionProps) => {
  const { data: rawPosts, isLoading } = useMyPlantsBlogPosts(plantNames);
  const posts = useFilterHidden(rawPosts);

  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="my-plants-blog-section">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="flex-none w-[200px] sm:w-[240px] h-56 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ArticleRow
      title="For your plants"
      posts={posts!}
      viewAllTo={posts!.length >= 4 ? '/discover/articles?mode=my-plants' : undefined}
      tones={['cream', 'water', 'terracotta']}
      testId="my-plants-blog-section"
    />
  );
};

export default MyPlantsBlogSection;
