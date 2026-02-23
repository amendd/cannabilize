import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

const LANDING_CONFIG_KEYS = [
  'landing_hero_headline',
  'landing_hero_subheadline',
  'landing_hero_image_url',
  'landing_hero_cta_text',
  'landing_logo_url',
  'landing_stat_rating',
  'landing_stat_patients',
  'landing_stat_consultations',
  'landing_stat_testimonials',
  'landing_stat_cities',
  'landing_progress_label',
  'landing_process_1_url',
  'landing_process_2_url',
  'landing_process_3_url',
  'landing_process_4_url',
  'landing_team_1_url',
  'landing_team_2_url',
  'landing_team_3_url',
  'landing_show_events_section',
  'landing_show_blog_preview_section',
  'landing_show_consumption_forms_section',
  'landing_consumption_forms_title',
  'landing_consumption_forms_badge',
  'landing_consumption_forms_badge_sub',
  'landing_consumption_forms_items',
] as const;

export type LandingConfigKeys = (typeof LANDING_CONFIG_KEYS)[number];

export interface LandingConfigPublic {
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
    ctaText: string;
  };
  logoUrl: string;
  stats: {
    rating: string;
    patients: string;
    consultations: string;
    testimonials: string;
    cities: string;
  };
  progressLabel: string;
  processImages: Record<number, string>;
  teamPhotos: Record<number, string>;
  showEventsSection: boolean;
  showBlogPreviewSection: boolean;
  showConsumptionFormsSection: boolean;
  consumptionForms: {
    title: string;
    badge: string;
    badgeSub: string;
    items: Array<{
      order: number;
      title: string;
      description: string;
      imageUrl: string;
    }>;
  };
  testimonials: Array<{
    id: string;
    name: string;
    photoUrl: string | null;
    shortQuote: string;
    fullQuote: string;
    displayDate: string;
    source: string;
    rating: number;
    featured: boolean;
  }>;
}

const DEFAULTS: LandingConfigPublic = {
  hero: {
    headline: 'Alívio com Cannabis Medicinal: legal, acessível e com médicos ao seu lado',
    subheadline: 'Consulta online por R$50. Sem burocracia: da avaliação até a chegada do medicamento, nós te guiamos.',
    imageUrl: '/images/hero/doctor-consultation.jpg',
    ctaText: 'Ver se o tratamento é indicado para mim',
  },
  logoUrl: '/images/cannalize-logo.png',
  stats: {
    rating: '4,9',
    patients: '90.000',
    consultations: '30.000',
    testimonials: '2.000',
    cities: '2.000',
  },
  progressLabel: 'Seu tratamento começa aqui — simples, legal e acompanhado',
  processImages: {
    1: '/images/process/consultation.jpg',
    2: '/images/process/prescription.jpg',
    3: '/images/process/anvisa.jpg',
    4: '/images/process/delivery.jpg',
  },
  teamPhotos: {
    1: '/images/team/dr-joao-silva.jpg',
    2: '/images/team/dra-maria-santos.jpg',
    3: '/images/team/equipe-suporte.jpg',
  },
  showEventsSection: true,
  showBlogPreviewSection: true,
  showConsumptionFormsSection: true,
  consumptionForms: {
    title: 'Formas de consumo',
    badge: 'Medicamentos',
    badgeSub: 'Importação legalizada pela ANVISA.',
    items: [
      {
        order: 1,
        title: 'Óleo de Cannabis Medicinal',
        description:
          'Aplicado sob a língua, o óleo é absorvido pela mucosa bucal, o que permite sua rápida entrada na corrente sanguínea, uma opção de resposta ágil e controlada.',
        imageUrl: '',
      },
      {
        order: 2,
        title: 'Creme de Cannabis Medicinal',
        description:
          'Aplicado diretamente sobre a pele, essa formulação é comumente indicada para dores musculares, inflamações localizadas e condições dermatológicas. Sua absorção ocorre de forma tópica, com mínimo ou nenhum impacto sistêmico.',
        imageUrl: '',
      },
      {
        order: 3,
        title: 'Jujuba de Cannabis Medicinal',
        description:
          'A jujuba proporciona uma forma prática, saborosa e discreta de consumo. Embora a absorção seja mais lenta por depender da digestão, os efeitos tendem a ser mais prolongados.',
        imageUrl: '',
      },
      {
        order: 4,
        title: 'Softgel de Cannabis Medicinal',
        description:
          'Forma prática, precisa e discreta de consumir cannabis medicinal. Com dosagem padronizada, são ingeridas por via oral e absorvidas gradualmente pelo organismo, proporcionando efeitos prolongados e estáveis.',
        imageUrl: '',
      },
    ],
  },
  testimonials: [],
};

async function getConfigMap(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'landing_' } },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

async function getSiteAssets(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteAsset.findMany({ orderBy: { sortOrder: 'asc' } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

async function getLandingTestimonials(): Promise<LandingConfigPublic['testimonials']> {
  try {
    const list = await prisma.landingTestimonial.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    });
    return list.map((t) => ({
      id: t.id,
      name: t.name,
      photoUrl: t.photoUrl,
      shortQuote: t.shortQuote,
      fullQuote: t.fullQuote,
      displayDate: t.displayDate,
      source: t.source,
      rating: t.rating,
      featured: t.featured,
    }));
  } catch {
    return [];
  }
}

async function getLandingConfigPublicUncached(): Promise<LandingConfigPublic> {
  const [configMap, assets, testimonials] = await Promise.all([
    getConfigMap(),
    getSiteAssets(),
    getLandingTestimonials(),
  ]);

  const hero = {
    headline: configMap.landing_hero_headline ?? DEFAULTS.hero.headline,
    subheadline: configMap.landing_hero_subheadline ?? DEFAULTS.hero.subheadline,
    imageUrl: configMap.landing_hero_image_url || assets.hero_image || DEFAULTS.hero.imageUrl,
    ctaText: configMap.landing_hero_cta_text ?? DEFAULTS.hero.ctaText,
  };

  const logoUrl = configMap.landing_logo_url || assets.logo || DEFAULTS.logoUrl;

  const stats = {
    rating: configMap.landing_stat_rating ?? DEFAULTS.stats.rating,
    patients: configMap.landing_stat_patients ?? DEFAULTS.stats.patients,
    consultations: configMap.landing_stat_consultations ?? DEFAULTS.stats.consultations,
    testimonials: configMap.landing_stat_testimonials ?? DEFAULTS.stats.testimonials,
    cities: configMap.landing_stat_cities ?? DEFAULTS.stats.cities,
  };

  const processImages: Record<number, string> = { ...DEFAULTS.processImages };
  for (let i = 1; i <= 4; i++) {
    const key = `landing_process_${i}_url` as const;
    const url = configMap[key] || assets[`process_${i}`];
    if (url) processImages[i] = url;
  }

  const progressLabel = configMap.landing_progress_label ?? DEFAULTS.progressLabel;

  const teamPhotos: Record<number, string> = { ...DEFAULTS.teamPhotos };
  for (let i = 1; i <= 3; i++) {
    const key = `landing_team_${i}_url` as const;
    const url = configMap[key] || assets[`team_${i}`];
    if (url) teamPhotos[i] = url;
  }

  const showEventsSection = configMap.landing_show_events_section !== 'false';
  const showBlogPreviewSection = configMap.landing_show_blog_preview_section !== 'false';
  const showConsumptionFormsSection = configMap.landing_show_consumption_forms_section !== 'false';

  let consumptionForms = DEFAULTS.consumptionForms;
  try {
    const raw = configMap.landing_consumption_forms_items;
    if (raw) {
      const parsed = JSON.parse(raw) as typeof consumptionForms.items;
      if (Array.isArray(parsed) && parsed.length > 0) {
        consumptionForms = {
          title: configMap.landing_consumption_forms_title ?? DEFAULTS.consumptionForms.title,
          badge: configMap.landing_consumption_forms_badge ?? DEFAULTS.consumptionForms.badge,
          badgeSub: configMap.landing_consumption_forms_badge_sub ?? DEFAULTS.consumptionForms.badgeSub,
          items: parsed
            .map((item: { order?: number; title?: string; description?: string; imageUrl?: string }) => ({
              order: Number(item.order) || 0,
              title: String(item.title ?? ''),
              description: String(item.description ?? ''),
              imageUrl: String(item.imageUrl ?? ''),
            }))
            .sort((a, b) => a.order - b.order),
        };
      }
    }
    if (configMap.landing_consumption_forms_title) consumptionForms.title = configMap.landing_consumption_forms_title;
    if (configMap.landing_consumption_forms_badge) consumptionForms.badge = configMap.landing_consumption_forms_badge;
    if (configMap.landing_consumption_forms_badge_sub) consumptionForms.badgeSub = configMap.landing_consumption_forms_badge_sub;
  } catch {
    // keep defaults
  }

  return {
    hero,
    logoUrl,
    stats,
    progressLabel,
    processImages,
    teamPhotos,
    showEventsSection,
    showBlogPreviewSection,
    showConsumptionFormsSection,
    consumptionForms,
    testimonials: testimonials.length > 0 ? testimonials : DEFAULTS.testimonials,
  };
}

export async function getLandingConfigPublic(): Promise<LandingConfigPublic> {
  return unstable_cache(
    getLandingConfigPublicUncached,
    ['landing-config-public'],
    { revalidate: 60 }
  )();
}
