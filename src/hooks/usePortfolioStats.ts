import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/contexts/AdminContext';
import * as api from '@/lib/api';
import type { Project, GalleryItem, Writing } from '@shared/schema';

interface PortfolioStatsResult {
  projects: Project[];
  galleryItems: GalleryItem[];
  writings: Writing[];
  isLoading: boolean;
  counts: Record<string, number>;
  getCount: (categoryId: string) => number;
  refreshTimestamp: number;
}

// Map dashboard category ids to underlying data source rules.
// Added optional `category` (top-level gallery/projects category) and custom aggregation.
interface SourceRule {
  type: 'project' | 'gallery' | 'writing';
  subcategory?: string; // match on subcategory
  category?: string;    // match on top-level category field
  aggregate?: (visible: { projects: Project[]; gallery: GalleryItem[]; writings: Writing[] }) => number;
}

const CATEGORY_ID_TO_SOURCE: Record<string, SourceRule> = {
  // Projects (use subcategory)
  'web-development': { type: 'project', subcategory: 'web-development' },
  'database-projects': { type: 'project', subcategory: 'database' },
  'ai-ml-projects': { type: 'project', subcategory: 'ai-ml' },
  'ui-ux-design': { type: 'gallery', category: 'ui-ux' },
  // Gallery based categories
  // digital-art: if actual data uses gallery category 'art' and subcategory 'digital-art', keep subcategory rule
  'digital-art': { type: 'gallery', subcategory: 'digital-art' },
  'ui-ux': { type: 'gallery', category: 'ui-ux' },
  // photography items are stored with category === 'photo' and various subcategories (portrait, landscape, etc)
  'photography': { type: 'gallery', category: 'photo' },
  // traditional-art items are stored with category === 'art' and diverse subcategories (drawing, painting, etc)
  'traditional-art': { type: 'gallery', category: 'art', aggregate: ({ gallery }) => gallery.filter(g => g.category === 'art').length },
  // Writings
  'creative-writing': { type: 'writing' },
};

export function usePortfolioStats(): PortfolioStatsResult {
  const { isAdmin } = useAdmin();

  // Single query that preloads everything needed for counts
  const query = useQuery({
    queryKey: ['portfolio-stats', { isAdmin }],
    queryFn: async () => {
      const [projects, galleryItems, writings] = await Promise.all([
        api.getProjects(),
        api.getGalleryItems(),
        api.getWritings(),
      ]);
      return { projects, galleryItems, writings, ts: Date.now() };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const projects: Project[] = query.data?.projects || [];
  const galleryItems: GalleryItem[] = query.data?.galleryItems || [];
  const writings: Writing[] = query.data?.writings || [];

  // Visibility filtering (exclude private if not admin)
  const visibleProjects = isAdmin ? projects : projects.filter(p => !p.isPrivate);
  const visibleGallery = isAdmin ? galleryItems : galleryItems.filter(g => !g.isPrivate);
  const visibleWritings = isAdmin ? writings : writings.filter(w => !w.isPrivate);

  // Precompute subcategory buckets
  const projectCountsBySub: Record<string, number> = {};
  for (const p of visibleProjects) {
    if (p.subcategory) projectCountsBySub[p.subcategory] = (projectCountsBySub[p.subcategory] || 0) + 1;
  }
  const galleryCountsBySub: Record<string, number> = {};
  for (const g of visibleGallery) {
    if (g.subcategory) galleryCountsBySub[g.subcategory] = (galleryCountsBySub[g.subcategory] || 0) + 1;
  }

  // Build counts
  const counts: Record<string, number> = {};
  const visibleContext = { projects: visibleProjects, gallery: visibleGallery, writings: visibleWritings };
  for (const [categoryId, rule] of Object.entries(CATEGORY_ID_TO_SOURCE)) {
    let value = 0;
    if (rule.aggregate) {
      // Custom aggregation overrides other logic
      value = rule.aggregate(visibleContext);
    } else if (rule.type === 'project') {
      if (rule.subcategory) value = projectCountsBySub[rule.subcategory] || 0;
      else if (rule.category) value = visibleProjects.filter(p => p.category === rule.category).length;
    } else if (rule.type === 'gallery') {
      if (rule.subcategory) value = galleryCountsBySub[rule.subcategory] || 0;
      else if (rule.category) value = visibleGallery.filter(g => g.category === rule.category).length;
    } else if (rule.type === 'writing') {
      value = visibleWritings.length;
    }
    counts[categoryId] = value;
  }

  return {
    projects,
    galleryItems,
    writings,
    isLoading: query.isLoading,
    counts,
    getCount: (categoryId: string) => counts[categoryId] ?? 0,
    refreshTimestamp: query.data?.ts || 0,
  };
}
