import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import plantNames from './plant-names.json' with { type: 'json' };

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlantNameEntry {
  name: string;
  botanicalName: string;
  category: string;
  otherNames?: string[];
}

interface ParsedPost {
  title: string;
  url: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  categories: string[];
}

interface RssFeed {
  name: string;
  url: string;
  sourceUrl: string;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const RSS_FEEDS: RssFeed[] = [
  { name: 'Epic Gardening', url: 'https://www.epicgardening.com/feed/', sourceUrl: 'https://www.epicgardening.com' },
  { name: 'Savvy Gardening', url: 'https://savvygardening.com/feed/', sourceUrl: 'https://savvygardening.com' },
  { name: 'Gardeners\' World', url: 'https://www.gardenersworld.com/feed', sourceUrl: 'https://www.gardenersworld.com' },
  { name: 'Plantura', url: 'https://plantura.garden/uk/feed', sourceUrl: 'https://plantura.garden/uk' },
  { name: 'Balcony Garden Web', url: 'https://balconygardenweb.com/feed/', sourceUrl: 'https://balconygardenweb.com' },
  { name: 'Smart Garden Guide', url: 'https://smartgardenguide.com/feed/', sourceUrl: 'https://smartgardenguide.com' },
  { name: 'Bloomsprouts', url: 'https://bloomsprouts.com/feed/', sourceUrl: 'https://bloomsprouts.com' },
  { name: 'Ohio Tropics', url: 'https://www.ohiotropics.com/feed/', sourceUrl: 'https://www.ohiotropics.com' },
  { name: 'Get Busy Gardening', url: 'https://getbusygardening.com/feed/', sourceUrl: 'https://getbusygardening.com' },
  { name: 'The Garden Geeks', url: 'https://www.thegardengeeks.com/feed/', sourceUrl: 'https://www.thegardengeeks.com' },
];

const SEASONAL_KEYWORDS: Record<string, string[]> = {
  winter: ['winter', 'cold weather', 'frost', 'dormancy', 'holiday plant', 'overwintering'],
  spring: ['spring', 'growing season', 'repotting', 'new growth', 'propagation', 'spring care', 'march', 'april', 'may', 'start seeds', 'seed starting'],
  summer: ['summer', 'heat stress', 'sunburn', 'vacation watering', 'outdoor plants'],
  fall: ['fall', 'autumn', 'prepare for winter', 'reduce watering', 'bring indoors'],
};

const GENERAL_KEYWORDS = [
  'watering tips', 'how to water', 'soil mix', 'potting soil', 'fertilizer',
  'fertilizing', 'pest control', 'pests', 'fungus gnats', 'root rot',
  'repotting', 'propagation', 'humidity', 'plant care', 'houseplant tips',
  'indoor plants', 'plant parent', 'beginner plants', 'low light plants',
  'overwatering', 'underwatering', 'yellow leaves', 'brown tips',
  'pruning', 'plant lighting', 'grow lights',
];

// Posts matching these title keywords are skipped entirely
const SKIP_TITLE_KEYWORDS = [
  'win ', 'giveaway', 'competition', 'sweepstakes', 'enter to win',
  'worth over', 'bundle from', 'discount code', 'coupon', 'promo code',
  'sponsored', 'advertisement', 'affiliate', 'deal of the', 'flash sale',
  'subscribe', 'newsletter', 'podcast', 'from the pod', 'conversations 20',
  'best tested', 'as tested by', 'review experts', 'reviews experts',
];

// Posts must mention at least one of these to be considered plant-related
const RELEVANCE_KEYWORDS = [
  // General plant terms
  'plant', 'flower', 'garden', 'seed', 'soil', 'compost', 'mulch',
  'root', 'leaf', 'leaves', 'stem', 'bloom', 'blossom', 'petal',
  'houseplant', 'indoor plant', 'outdoor plant', 'potted',
  // Care actions
  'water', 'prune', 'pruning', 'fertilize', 'fertilizer', 'repot',
  'propagat', 'transplant', 'deadhead', 'mulch', 'compost',
  'grow', 'growing', 'harvest', 'sow', 'sowing',
  // Plant types
  'succulent', 'cactus', 'cacti', 'fern', 'palm', 'orchid', 'herb',
  'shrub', 'tree', 'vine', 'bulb', 'perennial', 'annual', 'tropical',
  // Problems & pests
  'pest', 'aphid', 'mealybug', 'spider mite', 'fungus', 'mold',
  'rot', 'wilt', 'blight', 'disease', 'yellowing', 'drooping',
  'neem oil', 'insecticidal',
  // Environment
  'sunlight', 'shade', 'humidity', 'drainage', 'pot', 'planter',
  'greenhouse', 'raised bed', 'container',
];

function shouldSkipPost(post: ParsedPost): boolean {
  const titleLower = post.title.toLowerCase();

  // Hard skip for promotional content
  if (SKIP_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) {
    return true;
  }

  // Must be plant-related — require a relevance keyword in the title
  // (summaries on gardening blogs almost always mention "garden" so title is a better signal)
  const isRelevant = RELEVANCE_KEYWORDS.some((kw) => titleLower.includes(kw));
  return !isRelevant;
}

// ─── RSS Parsing ─────────────────────────────────────────────────────────────

function extractImageFromHtml(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return imgMatch?.[1] ?? null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/** Extract text content of an XML tag (handles CDATA) */
function getTagContent(xml: string, tag: string): string {
  // Match both <tag>...</tag> and <tag ...>...</tag>, non-greedy
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

/** Extract attribute value from an XML tag */
function getAttr(xml: string, tag: string, attr: string): string | null {
  const tagRe = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*/?>`, 'i');
  const m = xml.match(tagRe);
  return m?.[1] ?? null;
}

function parseFeed(xml: string): ParsedPost[] {
  const posts: ParsedPost[] = [];

  // Try RSS 2.0: extract <item>...</item> blocks
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi);
  if (itemBlocks && itemBlocks.length > 0) {
    for (const block of itemBlocks) {
      const title = stripHtml(getTagContent(block, 'title'));
      // <link> in RSS is usually just text content (no CDATA)
      const url = getTagContent(block, 'link').trim();
      if (!title || !url) continue;

      const description = getTagContent(block, 'description');
      const contentEncoded = getTagContent(block, 'content:encoded');
      const summary = stripHtml(description).slice(0, 500);
      const pubDate = getTagContent(block, 'pubDate');

      // Image: try enclosure, media:content, media:thumbnail,
      // then img in description, then img in content:encoded
      let imageUrl = getAttr(block, 'enclosure', 'url');
      if (!imageUrl) imageUrl = getAttr(block, 'media:content', 'url');
      if (!imageUrl) imageUrl = getAttr(block, 'media:thumbnail', 'url');
      if (!imageUrl) imageUrl = extractImageFromHtml(description);
      if (!imageUrl && contentEncoded) imageUrl = extractImageFromHtml(contentEncoded);

      // Categories
      const categories: string[] = [];
      const catMatches = block.match(/<category[^>]*>[\s\S]*?<\/category>/gi);
      if (catMatches) {
        for (const catBlock of catMatches) {
          const cat = stripHtml(getTagContent(catBlock.replace(/^<category/, '<c').replace(/<\/category>/, '</c>'), 'c'));
          if (cat) categories.push(cat.toLowerCase());
        }
      }

      posts.push({ title, url, summary, imageUrl, publishedAt: parseRssDate(pubDate), categories });
    }
    return posts;
  }

  // Try Atom: extract <entry>...</entry> blocks
  const entryBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi);
  if (entryBlocks) {
    for (const block of entryBlocks) {
      const title = stripHtml(getTagContent(block, 'title'));
      // Atom links use href attribute
      const url = getAttr(block, 'link', 'href') ?? '';
      if (!title || !url) continue;

      const content = getTagContent(block, 'content') || getTagContent(block, 'summary');
      const summary = stripHtml(content).slice(0, 500);
      const published = getTagContent(block, 'published') || getTagContent(block, 'updated');
      const imageUrl = extractImageFromHtml(content);

      const categories: string[] = [];
      const termMatches = block.match(/<category[^>]*term=["']([^"']+)["'][^>]*\/?>/gi);
      if (termMatches) {
        for (const tm of termMatches) {
          const termVal = tm.match(/term=["']([^"']+)["']/i);
          if (termVal) categories.push(termVal[1].toLowerCase());
        }
      }

      posts.push({ title, url, summary, imageUrl, publishedAt: parseRssDate(published), categories });
    }
  }

  return posts;
}

// ─── OG Image Fallback ──────────────────────────────────────────────────────

/** Fetch article page and extract og:image meta tag */
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sprouthub/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;

    // Only read first 50KB to find meta tags in <head>
    const reader = resp.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 50_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    // Skip logos/icons that aren't real article images
    const isLogo = (imgUrl: string) =>
      /logo|favicon|icon|badge|avatar/i.test(imgUrl) && !/featured|post|article|upload/i.test(imgUrl);

    // Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch?.[1] && !isLogo(ogMatch[1])) return ogMatch[1];

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i);
    if (twMatch?.[1] && !isLogo(twMatch[1])) return twMatch[1];

    // Fallback: find first large content image in body
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi);
    for (const m of imgMatches) {
      const src = m[1];
      if (!isLogo(src) && /\.(jpg|jpeg|png|webp)/i.test(src) && !/\b(1x1|pixel|spacer|blank)\b/i.test(src)) {
        return src;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Plant Matching ──────────────────────────────────────────────────────────

function matchPlantsToPost(
  post: ParsedPost,
  plants: PlantNameEntry[]
): { name: string; score: number }[] {
  const text = `${post.title} ${post.summary}`.toLowerCase();
  const titleLower = post.title.toLowerCase();
  const matches: { name: string; score: number }[] = [];
  const seen = new Set<string>();

  for (const plant of plants) {
    const nameLower = plant.name.toLowerCase();
    if (seen.has(nameLower)) continue;

    const allNames = [
      nameLower,
      plant.botanicalName.toLowerCase(),
      ...(plant.otherNames ?? []).map((n) => n.toLowerCase()),
    ];

    for (const name of allNames) {
      // Skip very short names to avoid false positives
      if (name.length < 4) continue;

      if (text.includes(name)) {
        const inTitle = titleLower.includes(name);
        matches.push({ name: plant.name, score: inTitle ? 0.9 : 0.5 });
        seen.add(nameLower);
        break;
      }
    }
  }

  // Genus-level matching: if the botanical genus appears in the post,
  // link it to matching plants at a lower score than a full-name match.
  // e.g. "Monstera Pinnatipartita" matches "Monstera Deliciosa" via genus "Monstera".
  for (const plant of plants) {
    const nameLower = plant.name.toLowerCase();
    if (seen.has(nameLower)) continue;

    const genus = plant.botanicalName.split(' ')[0].toLowerCase();
    // Only use genus if it's distinctive enough to avoid false positives
    if (genus.length >= 6 && text.includes(genus)) {
      const inTitle = titleLower.includes(genus);
      matches.push({ name: plant.name, score: inTitle ? 0.4 : 0.25 });
      seen.add(nameLower);
    }
  }

  // Category-level matching (e.g. "succulent care" matches all succulents)
  const categoryKeywords: Record<string, string> = {
    succulent: 'Succulents & Cacti',
    cactus: 'Succulents & Cacti',
    orchid: 'Flowering Plants',
    fern: 'Tropical & Foliage',
    palm: 'Trees & Large Plants',
  };

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (text.includes(keyword)) {
      for (const plant of plants) {
        const nameLower = plant.name.toLowerCase();
        if (!seen.has(nameLower) && plant.category === category) {
          matches.push({ name: plant.name, score: 0.3 });
          seen.add(nameLower);
        }
      }
    }
  }

  return matches;
}

// ─── Seasonal & General Detection ────────────────────────────────────────────

function detectSeason(post: ParsedPost): string | null {
  const text = `${post.title} ${post.summary}`.toLowerCase();
  for (const [season, keywords] of Object.entries(SEASONAL_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return season;
    }
  }
  return null;
}

function isGeneralPost(post: ParsedPost): boolean {
  const text = `${post.title} ${post.summary}`.toLowerCase();
  return GENERAL_KEYWORDS.some((kw) => text.includes(kw));
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting blog post fetch job...');

    const plants = plantNames as PlantNameEntry[];
    let totalInserted = 0;
    let totalSkipped = 0;
    let feedErrors = 0;
    const feedErrorDetails: string[] = [];
    const feedStats: Record<string, { parsed: number; inserted: number; skipped: number; filtered: number }> = {};

    for (const feed of RSS_FEEDS) {
      feedStats[feed.name] = { parsed: 0, inserted: 0, skipped: 0, filtered: 0 };
      try {
        console.log(`Fetching feed: ${feed.name} (${feed.url})`);
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; sprouthub/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          console.error(`Feed ${feed.name} returned ${response.status}: ${body.slice(0, 200)}`);
          feedErrors++;
          feedErrorDetails.push(`${feed.name}: HTTP ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const posts = parseFeed(xml);
        feedStats[feed.name].parsed = posts.length;
        console.log(`Parsed ${posts.length} posts from ${feed.name}`);

        for (const post of posts) {
          // Skip promotional / non-plant-care content
          if (shouldSkipPost(post)) {
            feedStats[feed.name].filtered++;
            continue;
          }

          // Skip posts older than 3 years (keep evergreen care guides)
          if (post.publishedAt) {
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
            if (new Date(post.publishedAt) < threeYearsAgo) continue;
          }

          // Fetch og:image from article page if no image found in RSS
          if (!post.imageUrl) {
            post.imageUrl = await fetchOgImage(post.url);
          }

          const season = detectSeason(post);
          const general = isGeneralPost(post);
          const plantMatches = matchPlantsToPost(post, plants);

          // Upsert blog post
          const { data: blogPost, error: upsertError } = await supabase
            .from('blog_posts')
            .upsert(
              {
                title: post.title,
                url: post.url,
                summary: post.summary || null,
                image_url: post.imageUrl,
                source_name: feed.name,
                source_url: feed.sourceUrl,
                published_at: post.publishedAt,
                fetched_at: new Date().toISOString(),
                categories: post.categories,
                is_seasonal: !!season,
                season,
                is_general: general,
              },
              { onConflict: 'url' }
            )
            .select('id')
            .single();

          if (upsertError) {
            console.error(`Error upserting post "${post.title}":`, upsertError.message);
            totalSkipped++;
            feedStats[feed.name].skipped++;
            continue;
          }

          // Insert plant matches
          if (blogPost && plantMatches.length > 0) {
            // Limit to top 20 matches to avoid excessive rows
            const topMatches = plantMatches
              .sort((a, b) => b.score - a.score)
              .slice(0, 20);

            const { error: matchError } = await supabase
              .from('blog_post_plants')
              .upsert(
                topMatches.map((m) => ({
                  blog_post_id: blogPost.id,
                  plant_name: m.name,
                  relevance_score: m.score,
                })),
                { onConflict: 'blog_post_id,plant_name' }
              );

            if (matchError) {
              console.error(`Error inserting plant matches for "${post.title}":`, matchError.message);
            }
          }

          totalInserted++;
          feedStats[feed.name].inserted++;
        }
      } catch (feedError) {
        const errMsg = feedError instanceof Error ? feedError.message : String(feedError);
        console.error(`Error processing feed ${feed.name}: ${errMsg}`);
        feedErrors++;
        feedErrorDetails.push(`${feed.name}: ${errMsg}`);
      }
    }

    // Clean up old posts (older than 3 years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const { error: cleanupError } = await supabase
      .from('blog_posts')
      .delete()
      .lt('fetched_at', threeYearsAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old posts:', cleanupError.message);
    }

    console.log(`Blog fetch complete: ${totalInserted} inserted/updated, ${totalSkipped} skipped, ${feedErrors} feed errors`);

    return new Response(
      JSON.stringify({
        success: true,
        posts_processed: totalInserted,
        posts_skipped: totalSkipped,
        feed_errors: feedErrors,
        feed_error_details: feedErrorDetails,
        feed_stats: feedStats,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Fatal error in blog fetch function:', error);
    return new Response(
      JSON.stringify({ error: String(error), success: false }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
