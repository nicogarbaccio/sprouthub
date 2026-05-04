import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeOff, RotateCcw } from 'lucide-react';
import { CascadingContainer } from '@/components/ui/cascading-container';
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
    <CascadingContainer delay={300}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Hidden Articles
                {articles.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({articles.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Articles you've hidden from your feed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't hidden any articles.
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="divide-y">
                {articles.map((article) => (
                  <li
                    key={article.blog_post_id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {article.title}
                      </p>
                      {article.source_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {article.source_name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unhide({ blogPostId: article.blog_post_id })}
                      disabled={isUnhiding || isRestoringAll}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>

              {articles.length >= 2 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 text-muted-foreground"
                    onClick={() => restoreAll()}
                    disabled={isRestoringAll || isUnhiding}
                  >
                    Restore all hidden articles
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </CascadingContainer>
  );
};

export default HiddenArticlesCard;
