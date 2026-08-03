import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlogPostCard from '../BlogPostCard';
import type { BlogPost } from '@/types/blogTypes';

// BlogPostCard uses useAuth, useSavedArticleIds, useToggleSavedArticle, and useHideArticle.
// Mock them so the component renders without providers.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/hooks/useSavedArticles', () => ({
  useSavedArticleIds: () => ({ data: new Set() }),
  useToggleSavedArticle: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useHiddenArticles', () => ({
  useHideArticle: () => ({ mutate: vi.fn(), isPending: false }),
}));

const makePost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: 'post-1',
  title: 'How to Care for Monstera',
  url: 'https://example.com/monstera',
  summary: 'A comprehensive guide to monstera care.',
  image_url: 'https://example.com/img.jpg',
  source_name: 'Plant Blog',
  source_url: 'https://example.com',
  published_at: '2025-06-15T00:00:00Z',
  fetched_at: '2025-06-16T00:00:00Z',
  categories: ['care'],
  is_seasonal: false,
  season: null,
  is_general: true,
  ...overrides,
});

describe('BlogPostCard', () => {
  it('should render title, summary, and source name', () => {
    render(<BlogPostCard post={makePost()} />);

    expect(screen.getByText('How to Care for Monstera')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive guide to monstera care.')).toBeInTheDocument();
    expect(screen.getByText('Plant Blog')).toBeInTheDocument();
  });

  it('should render a link that opens in a new tab', () => {
    render(<BlogPostCard post={makePost()} />);

    const link = screen.getByRole('link', { name: 'How to Care for Monstera' });
    expect(link).toHaveAttribute('href', 'https://example.com/monstera');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('should format and display the published date', () => {
    render(<BlogPostCard post={makePost({ published_at: '2025-06-15T12:00:00Z' })} />);

    // Date formatting depends on local timezone, so use a regex
    expect(screen.getByText(/Jun \d{1,2}, 2025/)).toBeInTheDocument();
  });

  it('should not display date when published_at is null', () => {
    render(<BlogPostCard post={makePost({ published_at: null })} />);

    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });

  it('should render an image when image_url is provided', () => {
    render(<BlogPostCard post={makePost()} />);

    const img = screen.getByAltText('How to Care for Monstera');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('example.com%2Fimg.jpg');
  });

  it('should show placeholder when image_url is null', () => {
    render(<BlogPostCard post={makePost({ image_url: null })} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should show placeholder when image fails to load', () => {
    render(<BlogPostCard post={makePost()} />);

    const img = screen.getByAltText('How to Care for Monstera');
    fireEvent.error(img);

    // After error, the img should be replaced with placeholder
    expect(screen.queryByAltText('How to Care for Monstera')).not.toBeInTheDocument();
  });

  it('should not render summary when it is null', () => {
    render(<BlogPostCard post={makePost({ summary: null })} />);

    expect(screen.queryByText('A comprehensive guide')).not.toBeInTheDocument();
  });

  it('should display matched plant badges', () => {
    render(<BlogPostCard post={makePost()} matchedPlants={['Monstera', 'Pothos']} />);

    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
  });

  it('should show +N badge when more than 2 matched plants', () => {
    render(
      <BlogPostCard
        post={makePost()}
        matchedPlants={['Monstera', 'Pothos', 'Snake Plant', 'Peace Lily']}
      />
    );

    // Only first 2 visible
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
    // +2 overflow badge
    expect(screen.getByText('+2')).toBeInTheDocument();
    // The others should not be rendered
    expect(screen.queryByText('Snake Plant')).not.toBeInTheDocument();
  });

  it('should not render plant badges when matchedPlants is undefined', () => {
    render(<BlogPostCard post={makePost()} />);

    expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
  });

  it('should not render plant badges when matchedPlants is empty', () => {
    render(<BlogPostCard post={makePost()} matchedPlants={[]} />);

    // The badge container should not be rendered
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
  });

  it('should have the blog-post-card test id', () => {
    render(<BlogPostCard post={makePost()} />);

    expect(screen.getByTestId('blog-post-card')).toBeInTheDocument();
  });
});
