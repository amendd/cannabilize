'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Save,
  Image as ImageIcon,
  Type,
  Star,
  User,
  Plus,
  Pencil,
  Trash2,
  Palette,
  Info,
  Upload,
  Layout,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

/** Bloco de ajuda: o que é, onde aparece, impacto e sugestão */
function FieldHelp({
  ondeAparece,
  impacto,
  sugestao,
  formato,
}: {
  ondeAparece: string;
  impacto?: string;
  sugestao?: string;
  formato?: string;
}) {
  return (
    <div className="mt-1 rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-gray-600">
      <span className="font-medium text-gray-700">Onde aparece:</span> {ondeAparece}
      {impacto && (
        <> · <span className="font-medium text-gray-700">Impacto:</span> {impacto}</>
      )}
      {sugestao && (
        <p className="mt-1 text-gray-600"><span className="font-medium text-gray-700">Sugestão:</span> {sugestao}</p>
      )}
      {formato && (
        <p className="mt-0.5 text-gray-500"><span className="font-medium text-gray-700">Formato ideal:</span> {formato}</p>
      )}
    </div>
  );
}

type LandingConfig = {
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
  showEventsSection?: boolean;
  showBlogPreviewSection?: boolean;
  showConsumptionFormsSection?: boolean;
  consumptionForms?: {
    title: string;
    badge: string;
    badgeSub: string;
    items: Array<{ order: number; title: string; description: string; imageUrl: string }>;
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
};

type LandingTestimonialRow = LandingConfig['testimonials'][0] & { active?: boolean };

/** Trata resposta do upload: 413 retorna HTML, evita parse JSON quebrado. */
async function parseUploadResponse(res: Response): Promise<{ url?: string; error?: string }> {
  const text = await res.text();
  if (res.status === 413) {
    return { error: 'Arquivo muito grande. Use até 2MB por imagem (ou 8MB para logo). Se o problema continuar, o servidor pode precisar de configuração (ex.: nginx client_max_body_size).' };
  }
  try {
    return JSON.parse(text) as { url?: string; error?: string };
  } catch {
    return { error: 'Erro ao enviar imagem' };
  }
}

export default function AdminIdentidadeVisualPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [testimonialsList, setTestimonialsList] = useState<LandingTestimonialRow[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [seedingTestimonials, setSeedingTestimonials] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingProcessStep, setUploadingProcessStep] = useState<number | null>(null);
  const [savingProcessStep, setSavingProcessStep] = useState<number | null>(null);
  const [uploadingTeamMember, setUploadingTeamMember] = useState<number | null>(null);
  const [savingTeamMember, setSavingTeamMember] = useState<number | null>(null);
  const [uploadingConsumptionImage, setUploadingConsumptionImage] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formTestimonial, setFormTestimonial] = useState({
    name: '',
    photoUrl: '',
    shortQuote: '',
    fullQuote: '',
    displayDate: '',
    source: 'Google',
    rating: 5,
    featured: false,
    active: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      load();
    }
  }, [status, session?.user?.role, router]);

  const load = async () => {
    try {
      setLoading(true);
      const [resConfig, resTestimonials] = await Promise.all([
        fetch('/api/admin/landing-config'),
        fetch('/api/admin/landing-testimonials'),
      ]);
      if (resConfig.ok) {
        const data = await resConfig.json();
        const items = data.consumptionForms?.items ?? [];
        const defaultItems = [
          { order: 1, title: 'Óleo de Cannabis Medicinal', description: '', imageUrl: '' },
          { order: 2, title: 'Creme de Cannabis Medicinal', description: '', imageUrl: '' },
          { order: 3, title: 'Jujuba de Cannabis Medicinal', description: '', imageUrl: '' },
          { order: 4, title: 'Softgel de Cannabis Medicinal', description: '', imageUrl: '' },
        ];
        const mergedItems = defaultItems.map((d, i) => ({
          ...d,
          ...(items[i] || items.find((it: { order: number }) => it.order === d.order)),
        }));
        setConfig({
          ...data,
          teamPhotos: data.teamPhotos || { 1: '', 2: '', 3: '' },
          showEventsSection: data.showEventsSection !== false,
          showBlogPreviewSection: data.showBlogPreviewSection !== false,
          showConsumptionFormsSection: data.showConsumptionFormsSection !== false,
          consumptionForms: {
            title: data.consumptionForms?.title ?? 'Formas de consumo',
            badge: data.consumptionForms?.badge ?? 'Medicamentos',
            badgeSub: data.consumptionForms?.badgeSub ?? 'Importação legalizada pela ANVISA.',
            items: mergedItems,
          },
        });
      }
      if (resTestimonials.ok) {
        const data = await resTestimonials.json();
        const list = Array.isArray(data) ? data : (data?.list ?? data?.data ?? []);
        setTestimonialsList(list);
      } else {
        setTestimonialsList([]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar configuração');
      setTestimonialsList([]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const body = {
        landing_hero_headline: config.hero.headline,
        landing_hero_subheadline: config.hero.subheadline,
        landing_hero_image_url: config.hero.imageUrl,
        landing_hero_cta_text: config.hero.ctaText,
        landing_logo_url: config.logoUrl,
        landing_stat_rating: config.stats.rating,
        landing_stat_patients: config.stats.patients,
        landing_stat_consultations: config.stats.consultations,
        landing_stat_testimonials: config.stats.testimonials,
        landing_stat_cities: config.stats.cities,
        landing_progress_label: config.progressLabel,
        landing_process_1_url: config.processImages[1] || '',
        landing_process_2_url: config.processImages[2] || '',
        landing_process_3_url: config.processImages[3] || '',
        landing_process_4_url: config.processImages[4] || '',
        landing_team_1_url: config.teamPhotos[1] || '',
        landing_team_2_url: config.teamPhotos[2] || '',
        landing_team_3_url: config.teamPhotos[3] || '',
        landing_show_events_section: config.showEventsSection !== false ? 'true' : 'false',
        landing_show_blog_preview_section: config.showBlogPreviewSection !== false ? 'true' : 'false',
        landing_show_consumption_forms_section: config.showConsumptionFormsSection !== false ? 'true' : 'false',
        landing_consumption_forms_title: config.consumptionForms?.title ?? 'Formas de consumo',
        landing_consumption_forms_badge: config.consumptionForms?.badge ?? 'Medicamentos',
        landing_consumption_forms_badge_sub: config.consumptionForms?.badgeSub ?? 'Importação legalizada pela ANVISA.',
        landing_consumption_forms_items: JSON.stringify(config.consumptionForms?.items ?? []),
      };
      const res = await fetch('/api/admin/landing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        toast.success('Configuração salva com sucesso!');
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const saveTestimonial = async () => {
    try {
      const url = editingTestimonial
        ? `/api/admin/landing-testimonials/${editingTestimonial}`
        : '/api/admin/landing-testimonials';
      const method = editingTestimonial ? 'PUT' : 'POST';
      const body = editingTestimonial
        ? formTestimonial
        : {
            ...formTestimonial,
            photoUrl: formTestimonial.photoUrl || undefined,
          };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingTestimonial ? 'Depoimento atualizado!' : 'Depoimento criado!');
        setShowTestimonialForm(false);
        setEditingTestimonial(null);
        setFormTestimonial({
          name: '',
          photoUrl: '',
          shortQuote: '',
          fullQuote: '',
          displayDate: '',
          source: 'Google',
          rating: 5,
          featured: false,
          active: true,
        });
        load();
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Erro ao salvar depoimento');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar depoimento');
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Excluir este depoimento?')) return;
    try {
      const res = await fetch(`/api/admin/landing-testimonials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Depoimento excluído');
        load();
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Erro ao excluir');
      }
    } catch (e) {
      toast.error('Erro ao excluir');
    }
  };

  const openEditTestimonial = (t: LandingTestimonialRow) => {
    setEditingTestimonial(t.id);
    setFormTestimonial({
      name: t.name,
      photoUrl: t.photoUrl || '',
      shortQuote: t.shortQuote,
      fullQuote: t.fullQuote,
      displayDate: t.displayDate,
      source: t.source,
      rating: t.rating,
      featured: t.featured,
      active: (t as { active?: boolean }).active ?? true,
    });
    setShowTestimonialForm(true);
  };

  const uploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPEG, PNG ou WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 2MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploadingHeroImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'hero');
      const res = await fetch('/api/admin/upload/landing-image', {
        method: 'POST',
        body: formData,
      });
      const data = await parseUploadResponse(res);
      if (res.ok && data.url) {
        setConfig({
          ...config,
          hero: { ...config.hero, imageUrl: data.url },
        });
        toast.success('Imagem enviada. Clique em "Salvar textos e Hero" para aplicar.');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingHeroImage(false);
      e.target.value = '';
    }
  };

  const uploadLogoImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPEG, PNG ou WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 8MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');
      const res = await fetch('/api/admin/upload/landing-image', {
        method: 'POST',
        body: formData,
      });
      const data = await parseUploadResponse(res);
      if (res.ok && data.url) {
        setConfig({ ...config, logoUrl: data.url });
        toast.success('Logo enviado. Clique em "Salvar logo" para aplicar.');
      } else {
        toast.error(data.error || 'Erro ao enviar logo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const uploadProcessImage = async (step: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPEG, PNG ou WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 2MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploadingProcessStep(step);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `process_${step}`);
      const res = await fetch('/api/admin/upload/landing-image', {
        method: 'POST',
        body: formData,
      });
      const data = await parseUploadResponse(res);
      if (res.ok && data.url) {
        setConfig({
          ...config,
          processImages: { ...config.processImages, [step]: data.url },
        });
        toast.success(`Imagem da etapa ${step} enviada. Clique em "Salvar etapa ${step}" para aplicar.`);
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingProcessStep(null);
      e.target.value = '';
    }
  };

  const saveProcessImage = async (step: number) => {
    if (!config) return;
    const url = config.processImages[step] ?? '';
    try {
      setSavingProcessStep(step);
      const res = await fetch('/api/admin/landing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`landing_process_${step}_url`]: url }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        toast.success(`Imagem da etapa ${step} salva.`);
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSavingProcessStep(null);
    }
  };

  const uploadTeamPhoto = async (member: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPEG, PNG ou WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 2MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploadingTeamMember(member);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `team_${member}`);
      const res = await fetch('/api/admin/upload/landing-image', {
        method: 'POST',
        body: formData,
      });
      const data = await parseUploadResponse(res);
      if (res.ok && data.url) {
        setConfig({
          ...config,
          teamPhotos: { ...(config.teamPhotos || {}), [member]: data.url },
        });
        toast.success(`Foto do membro ${member} enviada. Clique em "Salvar" para aplicar.`);
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingTeamMember(null);
      e.target.value = '';
    }
  };

  const uploadConsumptionImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config?.consumptionForms) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPEG, PNG ou WebP).');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 2MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploadingConsumptionImage(index);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `consumption_${index}`);
      const res = await fetch('/api/admin/upload/landing-image', {
        method: 'POST',
        body: formData,
      });
      const data = await parseUploadResponse(res);
      if (res.ok && data.url) {
        const items = [...(config.consumptionForms?.items ?? [])];
        while (items.length < index) items.push({ order: items.length + 1, title: '', description: '', imageUrl: '' });
        items[index - 1] = { ...(items[index - 1] ?? { order: index, title: '', description: '', imageUrl: '' }), imageUrl: data.url };
        setConfig({
          ...config,
          consumptionForms: { ...config.consumptionForms, items },
        });
        toast.success(`Imagem do item ${index} enviada. Clique em "Salvar Formas de consumo" para aplicar.`);
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingConsumptionImage(null);
      e.target.value = '';
    }
  };

  const saveTeamPhoto = async (member: number) => {
    if (!config) return;
    const url = config.teamPhotos?.[member] ?? '';
    try {
      setSavingTeamMember(member);
      const res = await fetch('/api/admin/landing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`landing_team_${member}_url`]: url }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        toast.success(`Foto do membro ${member} salva.`);
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSavingTeamMember(null);
    }
  };

  const seedDefaultTestimonials = async () => {
    try {
      setSeedingTestimonials(true);
      const res = await fetch('/api/admin/landing-testimonials/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data?.list) {
        setTestimonialsList(data.list);
        toast.success('Depoimentos padrão carregados. Agora você pode editar ou excluir.');
      } else if (res.ok && data?.message) {
        toast.success(data.message);
        load();
      } else {
        toast.error(data?.error || 'Erro ao carregar depoimentos padrão');
        load();
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar depoimentos padrão');
      load();
    } finally {
      setSeedingTestimonials(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Identidade Visual' }]} />
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Identidade Visual' }]} />
      <div className="mt-6 flex items-center gap-2 text-gray-700">
        <Palette size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Identidade Visual e Landing</h1>
      </div>
      <p className="mt-2 text-gray-600">
        Gerencie textos, imagens e depoimentos exibidos na página inicial do site. Cada bloco tem descrição do que o campo faz, onde aparece na home e sugestões de formato (tamanho de imagem, quantidade de caracteres). Alterações são salvas por bloco; a home usa esses dados assim que você salvar.
      </p>

      {/* Banner Hero */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Type size={20} />
          Banner Hero (primeira dobra da home)
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Título, subtítulo, botão e imagem principal da página inicial. Define a primeira impressão e direciona a conversão.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Headline (título principal)</label>
            <FieldHelp
              ondeAparece="Destaque na parte superior da landing (primeira dobra)"
              impacto="Captura atenção, comunica valor e segurança jurídica"
              sugestao="Linguagem clara e orientada à solução da dor. Ideal: 60–80 caracteres."
            />
            <Input
              value={config.hero.headline}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, headline: e.target.value },
                })
              }
              className="mt-2"
              placeholder="Ex: Tratamento com Cannabis Medicinal de forma legal..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subheadline</label>
            <FieldHelp
              ondeAparece="Logo abaixo da headline, na primeira dobra"
              impacto="Remove medos, explica benefício (preço, suporte) e gera confiança"
              sugestao="Destaque preço, ausência de burocracia e suporte. Ideal: 120–160 caracteres."
            />
            <Input
              value={config.hero.subheadline}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, subheadline: e.target.value },
                })
              }
              className="mt-2"
              placeholder="Ex: Consulta online por apenas R$50..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Texto do botão principal (CTA)</label>
            <FieldHelp
              ondeAparece="Botão principal na seção Hero"
              impacto="Guia o próximo passo; crucial para conversão"
              sugestao="Verbo de ação + benefício. Ex: Quero iniciar meu tratamento. Ideal: 20–30 caracteres."
            />
            <Input
              value={config.hero.ctaText}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, ctaText: e.target.value },
                })
              }
              className="mt-2"
              placeholder="Ex: Quero iniciar meu tratamento"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">URL da imagem do Hero</label>
            <FieldHelp
              ondeAparece="Lado direito da seção Hero, ao lado do texto e CTAs"
              impacto="Transmite profissionalismo e contexto; imagens que explicam o processo convertem mais"
              sugestao="Use imagem que ilustre consulta online, médico com paciente ou passo a passo. Evite só decorativa."
              formato="1200×800px (3:2 ou 4:3), máx. 2MB. JPEG, PNG ou WebP. Ou envie um arquivo abaixo."
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                value={config.hero.imageUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: { ...config.hero, imageUrl: e.target.value },
                  })
                }
                className="flex-1 min-w-[200px]"
                placeholder="/images/hero/doctor-consultation.jpg ou URL externa"
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="hero-image-upload"
                onChange={uploadHeroImage}
                disabled={uploadingHeroImage}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById('hero-image-upload')?.click()}
                disabled={uploadingHeroImage}
                className="gap-2 shrink-0"
              >
                <Upload size={18} />
                {uploadingHeroImage ? 'Enviando...' : 'Enviar imagem'}
              </Button>
            </div>
            {config.hero.imageUrl && (
              <div className="mt-2 h-28 w-56 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img
                  src={config.hero.imageUrl}
                  alt="Preview hero"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar textos e Hero'}
          </Button>
        </div>
      </section>

      {/* Marca e logo */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ImageIcon size={20} />
          Marca e logo
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Logo exibido no cabeçalho (navbar), rodapé, login, áreas logadas e favicon da aba do navegador.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">URL do logo</label>
            <FieldHelp
              ondeAparece="Navbar, footer, login, recuperar senha, área paciente/médico/admin, receita, favicon"
              impacto="Identidade da marca em todo o site"
              formato="200×60px (ou proporção similar), máx. 50KB. PNG com transparência."
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                value={config.logoUrl}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                className="flex-1 min-w-[200px]"
                placeholder="/images/cannalize-logo.png"
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="logo-upload"
                onChange={uploadLogoImage}
                disabled={uploadingLogo}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={uploadingLogo}
                className="gap-2 shrink-0"
              >
                <Upload size={18} />
                {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
              </Button>
            </div>
            {config.logoUrl && (
              <div className="mt-2 flex h-12 w-40 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white p-1">
                <img src={config.logoUrl} alt="Logo" className="max-h-full w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            Salvar logo
          </Button>
        </div>
      </section>

      {/* Seções exibidas na home */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Layout size={20} />
          Seções exibidas na home
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Ative ou desative a exibição das seções &quot;Nossa história está apenas começando&quot;, &quot;Artigos em destaque&quot; e &quot;Formas de consumo&quot; na página inicial.
        </p>
        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.showEventsSection !== false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  showEventsSection: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Exibir &quot;Nossa história está apenas começando&quot;
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.showBlogPreviewSection !== false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  showBlogPreviewSection: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Exibir &quot;Artigos em destaque&quot;
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.showConsumptionFormsSection !== false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  showConsumptionFormsSection: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Exibir &quot;Formas de consumo&quot;
            </span>
          </label>
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar exibição das seções'}
          </Button>
        </div>
      </section>

      {/* Formas de consumo */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Type size={20} />
          Formas de consumo
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Título, badge e os 4 itens (título, descrição e imagem) exibidos na seção &quot;Formas de consumo&quot; da home. Ative ou desative a seção em &quot;Seções exibidas na home&quot;.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título da seção</label>
            <Input
              value={config.consumptionForms?.title ?? ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  consumptionForms: {
                    ...config.consumptionForms!,
                    title: e.target.value,
                  },
                })
              }
              placeholder="Formas de consumo"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Badge (ex.: Medicamentos)</label>
              <Input
                value={config.consumptionForms?.badge ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    consumptionForms: {
                      ...config.consumptionForms!,
                      badge: e.target.value,
                    },
                  })
                }
                placeholder="Medicamentos"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Texto abaixo do badge</label>
              <Input
                value={config.consumptionForms?.badgeSub ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    consumptionForms: {
                      ...config.consumptionForms!,
                      badgeSub: e.target.value,
                    },
                  })
                }
                placeholder="Importação legalizada pela ANVISA."
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-6">
            <span className="block text-sm font-medium text-gray-700 mb-3">Itens (01 a 04)</span>
            <FieldHelp
              ondeAparece='Seção "Formas de consumo" na home; ao expandir cada item, a imagem aparece à direita do texto (como na referência).'
              impacto="Ilustra cada forma de consumo e transmite confiança."
              formato="Proporção 4:3 (ex.: 400×300 px). JPEG, PNG ou WebP. Máx. 2MB por imagem."
            />
            <div className="mt-4 space-y-6">
              {[1, 2, 3, 4].map((i) => {
                const item = config.consumptionForms?.items?.[i - 1] ?? {
                  order: i,
                  title: '',
                  description: '',
                  imageUrl: '',
                };
                return (
                  <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item {String(i).padStart(2, '0')}
                    </label>
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const items = [...(config.consumptionForms?.items ?? [])];
                        while (items.length < i) items.push({ order: items.length + 1, title: '', description: '', imageUrl: '' });
                        items[i - 1] = { ...items[i - 1], order: i, title: e.target.value };
                        setConfig({
                          ...config,
                          consumptionForms: { ...config.consumptionForms!, items },
                        });
                      }}
                      placeholder={`Título do item ${i}`}
                      className="mb-3"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => {
                        const items = [...(config.consumptionForms?.items ?? [])];
                        while (items.length < i) items.push({ order: items.length + 1, title: '', description: '', imageUrl: '' });
                        items[i - 1] = { ...items[i - 1], order: i, description: e.target.value };
                        setConfig({
                          ...config,
                          consumptionForms: { ...config.consumptionForms!, items },
                        });
                      }}
                      placeholder="Descrição exibida ao expandir o item na home."
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-primary"
                    />
                    <div className="mt-3 flex flex-wrap items-start gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <label className="block text-xs font-medium text-gray-500">Imagem do item (upload ou URL)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          id={`consumption-image-upload-${i}`}
                          onChange={(e) => uploadConsumptionImage(i, e)}
                          disabled={uploadingConsumptionImage !== null}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`consumption-image-upload-${i}`)?.click()}
                          disabled={uploadingConsumptionImage !== null}
                          className="relative flex h-28 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition hover:border-primary hover:bg-gray-50 disabled:opacity-50"
                        >
                          {item.imageUrl ? (
                            <>
                              <img
                                src={item.imageUrl}
                                alt={`Item ${i}`}
                                className="h-full w-full object-cover image-preview"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement?.querySelector('.upload-placeholder')?.classList.remove('hidden');
                                }}
                              />
                              <span className="upload-placeholder hidden absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-50 text-center text-xs text-gray-500">
                                <Upload size={24} className="text-gray-400" />
                                Clique para enviar
                              </span>
                            </>
                          ) : (
                            <span className="flex flex-col items-center gap-1 text-center text-xs text-gray-500">
                              <Upload size={24} className="text-gray-400" />
                              Clique para enviar
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500">Ou URL da imagem</label>
                        <Input
                          value={item.imageUrl}
                          onChange={(e) => {
                            const items = [...(config.consumptionForms?.items ?? [])];
                            while (items.length < i) items.push({ order: items.length + 1, title: '', description: '', imageUrl: '' });
                            items[i - 1] = { ...items[i - 1], order: i, imageUrl: e.target.value };
                            setConfig({
                              ...config,
                              consumptionForms: { ...config.consumptionForms!, items },
                            });
                          }}
                          placeholder="/images/consumption/item-1.jpg"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Formas de consumo'}
          </Button>
        </div>
      </section>

      {/* Como funciona (imagens do processo) */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ImageIcon size={20} />
          Como funciona (imagens das 4 etapas)
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Imagens da seção &quot;O processo da CannabiLize acontece em quatro etapas&quot; na home. Cada card expandido exibe a imagem correspondente. Envie uma imagem ou informe a URL e salve por etapa.
        </p>
        <div className="mt-4 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <label className="block text-sm font-medium text-gray-700">
                Imagem etapa {i} (processo)
              </label>
              <FieldHelp
                ondeAparece={`Seção "Como funciona", card da etapa ${i} (consulta, receita, ANVISA ou entrega)`}
                impacto="Torna o processo mais claro e reduz medo da burocracia"
                formato="400×300px (4:3) ou ícone 128×128px. Máx. 2MB. JPEG, PNG ou WebP."
              />
              <div className="mt-3 flex flex-wrap items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id={`process-image-upload-${i}`}
                    onChange={(e) => uploadProcessImage(i, e)}
                    disabled={uploadingProcessStep !== null}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`process-image-upload-${i}`)?.click()}
                    disabled={uploadingProcessStep !== null}
                    className="relative flex h-28 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition hover:border-primary hover:bg-gray-50 disabled:opacity-50"
                  >
                    {config.processImages[i] ? (
                      <>
                        <img
                          src={config.processImages[i]}
                          alt={`Etapa ${i}`}
                          className="h-full w-full object-cover image-preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement?.querySelector('.upload-placeholder')?.classList.remove('hidden');
                          }}
                        />
                        <span className="upload-placeholder hidden absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-50 text-center text-xs text-gray-500">
                          <Upload size={24} className="text-gray-400" />
                          Clique para enviar
                        </span>
                      </>
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-center text-xs text-gray-500">
                        <Upload size={24} className="text-gray-400" />
                        Clique para enviar
                      </span>
                    )}
                  </button>
                  {uploadingProcessStep === i && (
                    <span className="text-xs text-gray-500">Enviando...</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={config.processImages[i] || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        processImages: { ...config.processImages, [i]: e.target.value },
                      })
                    }
                    placeholder={`/images/process/step-${i}.jpg ou URL`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => document.getElementById(`process-image-upload-${i}`)?.click()}
                      disabled={uploadingProcessStep !== null}
                      className="gap-1.5"
                    >
                      <Upload size={16} />
                      {uploadingProcessStep === i ? 'Enviando...' : 'Enviar imagem'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveProcessImage(i)}
                      disabled={savingProcessStep !== null || !(config.processImages[i] ?? '').trim()}
                      className="gap-1.5"
                    >
                      <Save size={16} />
                      {savingProcessStep === i ? 'Salvando...' : `Salvar etapa ${i}`}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} variant="secondary" className="gap-2">
            <Save size={18} />
            Salvar todas as etapas de uma vez
          </Button>
        </div>
      </section>

      {/* Equipe (Sobre Nós) */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User size={20} />
          Equipe (Sobre Nós)
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Fotos exibidas na página Sobre Nós, seção &quot;Profissionais Especializados&quot; (3 cards: dois médicos e equipe de suporte).
        </p>
        <div className="mt-4 space-y-6">
          {([1, 2, 3] as const).map((i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <label className="block text-sm font-medium text-gray-700">
                Foto do membro {i} {i === 1 && '(ex.: médico)'} {i === 2 && '(ex.: médica)'} {i === 3 && '(ex.: equipe suporte)'}
              </label>
              <FieldHelp
                ondeAparece={`Página Sobre Nós, card do membro ${i}`}
                impacto="Transmite confiança e humaniza o atendimento"
                formato="Quadrado ou que funcione em círculo. Mín. 128×128px, ideal 256×256px. JPEG, PNG ou WebP. Ou envie um arquivo abaixo."
              />
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <Input
                  value={config.teamPhotos?.[i] ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      teamPhotos: { ...(config.teamPhotos || {}), [i]: e.target.value },
                    })
                  }
                  className="flex-1 min-w-[200px]"
                  placeholder={i === 1 ? '/images/team/dr-joao-silva.jpg' : i === 2 ? '/images/team/dra-maria-santos.jpg' : '/images/team/equipe-suporte.jpg'}
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id={`team-photo-upload-${i}`}
                  onChange={(e) => uploadTeamPhoto(i, e)}
                  disabled={uploadingTeamMember !== null}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById(`team-photo-upload-${i}`)?.click()}
                  disabled={uploadingTeamMember !== null}
                  className="gap-2 shrink-0"
                >
                  <Upload size={18} />
                  {uploadingTeamMember === i ? 'Enviando...' : 'Enviar imagem'}
                </Button>
                <Button
                  type="button"
                  onClick={() => saveTeamPhoto(i)}
                  disabled={savingTeamMember !== null}
                  className="gap-2 shrink-0"
                >
                  <Save size={18} />
                  {savingTeamMember === i ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
              {config.teamPhotos?.[i] && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100 shrink-0">
                    <img src={config.teamPhotos[i]} alt={`Membro ${i}`} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <span className="text-xs text-gray-500">Preview (exibido em círculo na página Sobre Nós)</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            Salvar todas as fotos da equipe de uma vez
          </Button>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Star size={20} />
          Números de prova social
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Exibidos no Hero (mini prova) e na faixa verde de estatísticas da home.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { key: 'rating' as const, label: 'Nota (ex: 4,9)', onde: 'Hero e seção de estatísticas', sugestao: 'Nota média (Google, Reclame Aqui). Use vírgula para decimal.' },
            { key: 'patients' as const, label: 'Pacientes (ex: 90.000)', onde: 'Hero e estatísticas', sugestao: 'Total de pacientes atendidos. Use ponto para milhares.' },
            { key: 'consultations' as const, label: 'Consultas', onde: 'Seção de estatísticas', sugestao: 'Total de consultas realizadas.' },
            { key: 'testimonials' as const, label: 'Depoimentos', onde: 'Seção de estatísticas', sugestao: 'Quantidade de depoimentos/avaliações.' },
            { key: 'cities' as const, label: 'Cidades', onde: 'Seção de estatísticas', sugestao: 'Cidades onde já há pacientes atendidos.' },
          ].map(({ key, label, onde, sugestao }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <p className="mt-0.5 text-xs text-gray-500">Onde: {onde}. {sugestao}</p>
              <Input
                value={config.stats[key]}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    stats: { ...config.stats, [key]: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Frase da barra de progresso</label>
          <FieldHelp
            ondeAparece="Faixa verde abaixo do Hero (ou sticky), guiando o usuário no funil"
            impacto="Gera sensação de avanço e reduz ansiedade; incentiva conclusão da jornada"
            sugestao="Frase curta e motivacional. Ex: Seu tratamento começa aqui — simples, legal e acompanhado."
          />
          <Input
            value={config.progressLabel}
            onChange={(e) => setConfig({ ...config, progressLabel: e.target.value })}
            className="mt-2"
            placeholder="Seu tratamento começa aqui — simples, legal e acompanhado"
          />
        </div>
        <div className="mt-4">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save size={18} />
            Salvar estatísticas
          </Button>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User size={20} />
            Depoimentos da landing
          </h2>
          <Button
            variant="secondary"
            onClick={() => {
              setEditingTestimonial(null);
              setFormTestimonial({
                name: '',
                photoUrl: '',
                shortQuote: '',
                fullQuote: '',
                displayDate: '',
                source: 'Google',
                rating: 5,
                featured: false,
                active: true,
              });
              setShowTestimonialForm(true);
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Novo depoimento
          </Button>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <Info size={14} />
          Exibidos na seção &quot;Relatos reais de pacientes&quot; da home. Um depoimento pode ser marcado como Destaque (visual diferenciado).
        </p>

        {testimonialsList.length === 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              Nenhum depoimento cadastrado no banco. A home exibe depoimentos padrão até você adicionar ou carregar os padrão aqui.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={seedDefaultTestimonials}
              disabled={seedingTestimonials}
              className="mt-3 gap-2"
            >
              {seedingTestimonials ? 'Carregando...' : 'Carregar depoimentos padrão da home'}
            </Button>
            <p className="mt-2 text-xs text-amber-700">
              Isso cria os 6 depoimentos que a home usa por padrão; depois você pode editar ou excluir cada um.
            </p>
          </div>
        )}

        {showTestimonialForm && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900">
              {editingTestimonial ? 'Editar depoimento' : 'Novo depoimento'}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-xs text-gray-500">Onde aparece: abaixo do texto. Sugestão: nome completo ou nome + inicial.</p>
                <Input
                  value={formTestimonial.name}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, name: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL da foto (avatar)</label>
                <p className="text-xs text-gray-500">Onde aparece: ao lado do depoimento. Formato ideal: 120×120px, máx. 50KB. JPEG/PNG.</p>
                <Input
                  value={formTestimonial.photoUrl}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, photoUrl: e.target.value })}
                  className="mt-1"
                  placeholder="/images/testimonials/avatar.jpg"
                />
                {formTestimonial.photoUrl && (
                  <div className="mt-2 h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                    <img src={formTestimonial.photoUrl} alt="Avatar" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Citação curta (1 linha)</label>
                <p className="text-xs text-gray-500">Exibida primeiro; depois o usuário pode expandir. Impacto rápido. Ideal: até 80 caracteres.</p>
                <Input
                  value={formTestimonial.shortQuote}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, shortQuote: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Pela primeira vez, 5 dias sem dores."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Citação completa</label>
                <p className="text-xs text-gray-500">Texto completo do depoimento (visível ao expandir). Foque em dor resolvida e resultado. Sugestão: até 300 caracteres para impacto.</p>
                <textarea
                  value={formTestimonial.fullQuote}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, fullQuote: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  placeholder="Texto completo do depoimento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data exibida</label>
                <p className="text-xs text-gray-500">Ao lado do nome; mostra que o depoimento é recente.</p>
                <Input
                  value={formTestimonial.displayDate}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, displayDate: e.target.value })}
                  className="mt-1"
                  placeholder="17/05/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fonte (ex: Google)</label>
                <p className="text-xs text-gray-500">Badge ao lado do nome; aumenta credibilidade.</p>
                <Input
                  value={formTestimonial.source}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, source: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nota (1–5)</label>
                <p className="text-xs text-gray-500">Estrelas exibidas no card do depoimento.</p>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={formTestimonial.rating}
                  onChange={(e) =>
                    setFormTestimonial({ ...formTestimonial, rating: parseInt(e.target.value, 10) || 5 })
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formTestimonial.featured}
                  onChange={(e) => setFormTestimonial({ ...formTestimonial, featured: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Destacar este depoimento (apenas um por vez) — card com borda e badge &quot;Destaque&quot;
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveTestimonial} className="gap-2">
                <Save size={18} />
                {editingTestimonial ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTestimonialForm(false);
                  setEditingTestimonial(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {testimonialsList.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-700">
                Depoimentos cadastrados ({testimonialsList.length}) — clique em Editar para alterar.
              </p>
              {testimonialsList.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {(t.photoUrl && (
                        <img
                          src={t.photoUrl}
                          alt={t.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => e.currentTarget.classList.add('opacity-0')}
                        />
                      )) || null}
                      <div className="flex h-full w-full items-center justify-center">
                        <User size={24} className="text-gray-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{t.shortQuote}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {t.featured && (
                          <span className="inline-block text-xs font-medium text-green-600">Destaque</span>
                        )}
                        <span className="text-xs text-gray-500">{t.displayDate} · {t.source}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditTestimonial(t)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      aria-label="Editar"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil size={16} />
                        Editar
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTestimonial(t.id)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
