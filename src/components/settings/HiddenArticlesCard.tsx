import { EyeOff, RotateCcw } from 'lucide-react';
import { SettingsCard } from './SettingsUI';
import {
  useHiddenArticles,
  useUnhideArticle,
  useRestoreAllHidden,
} from '@/hooks/useHiddenArticles';

const HiddenArticlesCard = () => {
  const { data: articles = [], isLoading } = useHiddenArticles();
  const { mutate: unhide, isPending: isUnhiding } = useUnhideArticle();
  const { mutate: restoreAll, isPending: isRestoringAll } = useRestoreAllHidden();

  return (
    <SettingsCard
      title="Hidden Articles"
      description={
        articles.length > 0
          ? `${articles.length} article${articles.length === 1 ? "" : "s"} hidden from Discover`
          : "Articles you've hidden from Discover"
      }
      icon={EyeOff}
      action={
        articles.length >= 2 ? (
          <button
            type="button"
            onClick={() => restoreAll()}
            disabled={isRestoringAll || isUnhiding}
            className="text-sm font-bold text-link disabled:opacity-50"
          >
            Restore all
          </button>
        ) : undefined
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground px-1">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">You haven't hidden any articles.</p>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <li
              key={article.blog_post_id}
              className="flex items-center justify-between gap-3 rounded-[18px] bg-field px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold truncate text-foreground">{article.title}</p>
                {article.source_name && (
                  <p className="text-[13px] text-muted-foreground truncate">{article.source_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => unhide({ blogPostId: article.blog_post_id })}
                disabled={isUnhiding || isRestoringAll}
                className="shrink-0 h-10 px-3.5 rounded-[14px] bg-card text-foreground text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
};

export default HiddenArticlesCard;
