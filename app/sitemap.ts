import type { MetadataRoute } from 'next';
import { getAllProjects } from '@/lib/projects';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/` },
    { url: `${siteUrl}/cv` },
    ...getAllProjects().map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
    })),
  ];
}
