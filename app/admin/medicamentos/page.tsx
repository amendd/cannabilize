'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Pill, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface Medication {
  id: string;
  name: string;
  productType: string;
  pharmaceuticalForm: string;
  activePrinciples: string[];
  cbdConcentrationValue: number;
  cbdConcentrationUnit: string;
  thcConcentrationValue: number;
  thcConcentrationUnit: string;
  otherCannabinoids?: Array<{ name: string; value: number; unit: string }>;
  spectrum: string;
  administrationRoute: string;
  dispensingUnit: string;
  allowsThc: boolean;
  regulatoryClassification?: string;
  supplier?: string;
  description?: string;
  active: boolean;
  order: number;
}

const OTHER_VALUE = '__OTHER__';

const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'OIL', label: 'Óleo' },
  { value: 'GUMMIES', label: 'Gummies' },
  { value: 'CAPSULES', label: 'Cápsulas' },
  { value: 'EXTRACT', label: 'Extrato' },
  { value: 'FLOWER', label: 'Flor' },
  { value: 'OTHER', label: 'Outro' },
];

const PHARM_FORM_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'Óleo oral', label: 'Óleo oral' },
  { value: 'Cápsula gelatinosa', label: 'Cápsula gelatinosa' },
  { value: 'Goma mastigável', label: 'Goma mastigável' },
  { value: 'Extrato vegetal', label: 'Extrato vegetal' },
  { value: OTHER_VALUE, label: 'Outro (digitar)' },
];

const ACTIVE_PRINCIPLE_OPTIONS = [
  { value: 'CBD', label: 'Canabidiol (CBD)' },
  { value: 'THC', label: 'Tetrahidrocanabinol (THC)' },
  { value: 'CBG', label: 'CBG' },
  { value: 'CBN', label: 'CBN' },
];

const CONCENTRATION_UNIT_OPTIONS = [
  { value: 'MG_PER_ML', label: 'mg/mL' },
  { value: 'MG_PER_UNIT', label: 'mg/unidade' },
];

const SPECTRUM_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'FULL_SPECTRUM', label: 'Full Spectrum' },
  { value: 'BROAD_SPECTRUM', label: 'Broad Spectrum' },
  { value: 'ISOLATE', label: 'Isolado' },
];

const ROUTE_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'SUBLINGUAL', label: 'Sublingual' },
  { value: 'ORAL', label: 'Oral' },
  { value: 'TOPICAL', label: 'Tópica' },
  { value: 'INHALATION', label: 'Inalatória' },
];

const DISPENSING_UNIT_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'Frasco 30 mL', label: 'Frasco 30 mL' },
  { value: 'Frasco 20 mL', label: 'Frasco 20 mL' },
  { value: 'Unidade (gummy)', label: 'Unidade (gummy)' },
  { value: 'Caixa com 30 cápsulas', label: 'Caixa com 30 cápsulas' },
  { value: OTHER_VALUE, label: 'Outro (digitar)' },
];

const REGULATORY_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'CBD_ONLY', label: 'CBD-only' },
  { value: 'CBD_THC', label: 'CBD + THC' },
  { value: 'CONTROLLED', label: 'Controle especial' },
];

const SUPPLIER_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'Associação X', label: 'Associação X' },
  { value: OTHER_VALUE, label: 'Outro (digitar)' },
];

export default function MedicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // 🟦 BLOCO 1
    name: '',
    productType: '',
    pharmaceuticalForm: '',
    pharmaceuticalFormOther: '',
    activePrinciples: [] as string[],

    // 🟩 BLOCO 2
    cbdConcentrationValue: '' as number | '',
    cbdConcentrationUnit: 'MG_PER_ML',
    thcConcentrationValue: '' as number | '',
    thcConcentrationUnit: 'MG_PER_ML',
    otherCannabinoids: [] as Array<{ name: string; value: number | ''; unit: string }>,
    spectrum: '',

    // 🟨 BLOCO 3
    administrationRoute: '',
    dispensingUnit: '',
    dispensingUnitOther: '',

    // 🟥 BLOCO 4
    regulatoryClassification: '',
    supplier: '',
    supplierOther: '',
    active: true,
    order: 0,

    // 🟪 BLOCO 5
    description: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      loadMedications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/medications');
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      toast.error('Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Normalizar campos "Outro"
      const pharmaceuticalForm =
        formData.pharmaceuticalForm === OTHER_VALUE
          ? formData.pharmaceuticalFormOther.trim()
          : formData.pharmaceuticalForm;

      const dispensingUnit =
        formData.dispensingUnit === OTHER_VALUE
          ? formData.dispensingUnitOther.trim()
          : formData.dispensingUnit;

      const supplier =
        formData.supplier === OTHER_VALUE
          ? formData.supplierOther.trim()
          : formData.supplier;

      if (!pharmaceuticalForm) {
        toast.error('Informe a forma farmacêutica');
        return;
      }
      if (!dispensingUnit) {
        toast.error('Informe a unidade de dispensação');
        return;
      }
      if (!formData.activePrinciples.length) {
        toast.error('Selecione pelo menos um princípio ativo');
        return;
      }

      const cbdConcentrationValue = Number(formData.cbdConcentrationValue);
      const thcConcentrationValue =
        formData.thcConcentrationValue === '' ? 0 : Number(formData.thcConcentrationValue);

      if (!Number.isFinite(cbdConcentrationValue) || cbdConcentrationValue <= 0) {
        toast.error('Informe a concentração de CBD (valor positivo)');
        return;
      }
      if (!Number.isFinite(thcConcentrationValue) || thcConcentrationValue < 0) {
        toast.error('Concentração de THC inválida');
        return;
      }

      const otherCannabinoids = (formData.otherCannabinoids || [])
        .filter((c) => c.name.trim() && c.value !== '')
        .map((c) => ({ name: c.name.trim(), value: Number(c.value), unit: c.unit }));

      const url = editingId
        ? `/api/admin/medications/${editingId}`
        : '/api/admin/medications';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          productType: formData.productType,
          pharmaceuticalForm,
          activePrinciples: formData.activePrinciples,
          cbdConcentrationValue,
          cbdConcentrationUnit: formData.cbdConcentrationUnit,
          thcConcentrationValue,
          thcConcentrationUnit: formData.thcConcentrationUnit,
          otherCannabinoids: otherCannabinoids.length ? otherCannabinoids : undefined,
          spectrum: formData.spectrum,
          administrationRoute: formData.administrationRoute,
          dispensingUnit,
          regulatoryClassification: formData.regulatoryClassification || undefined,
          supplier: supplier || undefined,
          description: formData.description || undefined,
          active: formData.active,
          order: formData.order,
        }),
      });

      if (response.ok) {
        toast.success(editingId ? 'Medicamento atualizado!' : 'Medicamento criado!');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadMedications();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar medicamento');
      }
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      toast.error('Erro ao salvar medicamento');
    }
  };

  const handleEdit = (medication: Medication) => {
    const pharmIsPreset = PHARM_FORM_OPTIONS.some((o) => o.value === medication.pharmaceuticalForm);
    const dispIsPreset = DISPENSING_UNIT_OPTIONS.some((o) => o.value === medication.dispensingUnit);
    const supplierIsPreset = SUPPLIER_OPTIONS.some((o) => o.value === (medication.supplier || ''));

    setEditingId(medication.id);
    setFormData({
      name: medication.name,
      productType: medication.productType || '',
      pharmaceuticalForm: pharmIsPreset ? medication.pharmaceuticalForm : OTHER_VALUE,
      pharmaceuticalFormOther: pharmIsPreset ? '' : medication.pharmaceuticalForm,
      activePrinciples: Array.isArray(medication.activePrinciples) ? medication.activePrinciples : [],

      cbdConcentrationValue: medication.cbdConcentrationValue ?? '',
      cbdConcentrationUnit: medication.cbdConcentrationUnit || 'MG_PER_ML',
      thcConcentrationValue: medication.thcConcentrationValue ?? 0,
      thcConcentrationUnit: medication.thcConcentrationUnit || 'MG_PER_ML',
      otherCannabinoids: (medication.otherCannabinoids || []).map((c) => ({
        name: c.name,
        value: c.value,
        unit: c.unit || 'MG_PER_ML',
      })),
      spectrum: medication.spectrum || '',

      administrationRoute: medication.administrationRoute || '',
      dispensingUnit: dispIsPreset ? medication.dispensingUnit : OTHER_VALUE,
      dispensingUnitOther: dispIsPreset ? '' : medication.dispensingUnit,

      regulatoryClassification: medication.regulatoryClassification || '',
      supplier: supplierIsPreset ? (medication.supplier || '') : OTHER_VALUE,
      supplierOther: supplierIsPreset ? '' : (medication.supplier || ''),
      description: medication.description || '',
      active: medication.active,
      order: medication.order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este medicamento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/medications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Medicamento desativado');
        loadMedications();
      } else {
        toast.error('Erro ao desativar medicamento');
      }
    } catch (error) {
      console.error('Erro ao desativar medicamento:', error);
      toast.error('Erro ao desativar medicamento');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productType: '',
      pharmaceuticalForm: '',
      pharmaceuticalFormOther: '',
      activePrinciples: [],
      cbdConcentrationValue: '',
      cbdConcentrationUnit: 'MG_PER_ML',
      thcConcentrationValue: '',
      thcConcentrationUnit: 'MG_PER_ML',
      otherCannabinoids: [],
      spectrum: '',
      administrationRoute: '',
      dispensingUnit: '',
      dispensingUnitOther: '',
      regulatoryClassification: '',
      supplier: '',
      supplierOther: '',
      description: '',
      active: true,
      order: 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <Breadcrumbs items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Medicamentos' },
            ]} />
            <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Medicamentos</h1>
            <p className="text-gray-600 mt-2">Gerencie a lista de medicamentos disponíveis para prescrição</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={20} />
              Novo Medicamento
            </Button>
          )}
        </motion.div>

        {/* Formulário */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Editar Medicamento' : 'Novo Medicamento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 🟦 BLOCO 1 — IDENTIFICAÇÃO DO MEDICAMENTO */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🟦 Identificação do Medicamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do Medicamento *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Select
                    label="Tipo de Produto *"
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    options={PRODUCT_TYPE_OPTIONS}
                    required
                  />
                  <Select
                    label="Forma Farmacêutica *"
                    value={formData.pharmaceuticalForm}
                    onChange={(e) => setFormData({ ...formData, pharmaceuticalForm: e.target.value })}
                    options={PHARM_FORM_OPTIONS}
                    required
                  />
                  {formData.pharmaceuticalForm === OTHER_VALUE && (
                    <Input
                      label="Outra forma farmacêutica *"
                      value={formData.pharmaceuticalFormOther}
                      onChange={(e) => setFormData({ ...formData, pharmaceuticalFormOther: e.target.value })}
                      required
                    />
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Princípio Ativo * (multi-seleção)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ACTIVE_PRINCIPLE_OPTIONS.map((opt) => {
                        const checked = formData.activePrinciples.includes(opt.value);
                        return (
                          <label key={opt.value} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? Array.from(new Set([...formData.activePrinciples, opt.value]))
                                  : formData.activePrinciples.filter((v) => v !== opt.value);
                                setFormData({ ...formData, activePrinciples: next });
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-800">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🟩 BLOCO 2 — COMPOSIÇÃO CANABINOIDE (CRÍTICO) */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🟩 Composição Canabinoide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Concentração de CBD *"
                      type="number"
                      value={formData.cbdConcentrationValue}
                      onChange={(e) => setFormData({ ...formData, cbdConcentrationValue: e.target.value === '' ? '' : Number(e.target.value) })}
                      required
                    />
                    <Select
                      label="Unidade *"
                      value={formData.cbdConcentrationUnit}
                      onChange={(e) => setFormData({ ...formData, cbdConcentrationUnit: e.target.value })}
                      options={CONCENTRATION_UNIT_OPTIONS}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Concentração de THC"
                      type="number"
                      value={formData.thcConcentrationValue}
                      onChange={(e) => setFormData({ ...formData, thcConcentrationValue: e.target.value === '' ? '' : Number(e.target.value) })}
                      placeholder="Pode ser 0"
                    />
                    <Select
                      label="Unidade"
                      value={formData.thcConcentrationUnit}
                      onChange={(e) => setFormData({ ...formData, thcConcentrationUnit: e.target.value })}
                      options={CONCENTRATION_UNIT_OPTIONS}
                    />
                  </div>

                  <Select
                    label="Espectro *"
                    value={formData.spectrum}
                    onChange={(e) => setFormData({ ...formData, spectrum: e.target.value })}
                    options={SPECTRUM_OPTIONS}
                    required
                  />

                  <div className="flex items-center gap-2 mt-6 md:mt-0">
                    {(Number(formData.thcConcentrationValue || 0) > 0) ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700"><strong>Permite THC:</strong> Sim</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-700"><strong>Permite THC:</strong> Não</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Outros Canabinoides (opcional)</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({
                        ...formData,
                        otherCannabinoids: [...formData.otherCannabinoids, { name: '', value: '', unit: 'MG_PER_ML' }],
                      })}
                    >
                      <Plus size={16} />
                      Adicionar
                    </Button>
                  </div>
                  {formData.otherCannabinoids.length > 0 && (
                    <div className="space-y-2">
                      {formData.otherCannabinoids.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg border">
                          <Input
                            label="Nome"
                            value={item.name}
                            onChange={(e) => {
                              const next = [...formData.otherCannabinoids];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setFormData({ ...formData, otherCannabinoids: next });
                            }}
                            placeholder="Ex: CBG"
                          />
                          <Input
                            label="Concentração"
                            type="number"
                            value={item.value}
                            onChange={(e) => {
                              const next = [...formData.otherCannabinoids];
                              next[idx] = { ...next[idx], value: e.target.value === '' ? '' : Number(e.target.value) };
                              setFormData({ ...formData, otherCannabinoids: next });
                            }}
                          />
                          <Select
                            label="Unidade"
                            value={item.unit}
                            onChange={(e) => {
                              const next = [...formData.otherCannabinoids];
                              next[idx] = { ...next[idx], unit: e.target.value };
                              setFormData({ ...formData, otherCannabinoids: next });
                            }}
                            options={CONCENTRATION_UNIT_OPTIONS}
                          />
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const next = formData.otherCannabinoids.filter((_, i) => i !== idx);
                                setFormData({ ...formData, otherCannabinoids: next });
                              }}
                            >
                              <Trash2 size={16} />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 🟨 BLOCO 3 — USO CLÍNICO E DISPENSAÇÃO */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🟨 Uso Clínico e Dispensação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Via de Administração *"
                    value={formData.administrationRoute}
                    onChange={(e) => setFormData({ ...formData, administrationRoute: e.target.value })}
                    options={ROUTE_OPTIONS}
                    required
                  />
                  <Select
                    label="Unidade de Dispensação *"
                    value={formData.dispensingUnit}
                    onChange={(e) => setFormData({ ...formData, dispensingUnit: e.target.value })}
                    options={DISPENSING_UNIT_OPTIONS}
                    required
                  />
                  {formData.dispensingUnit === OTHER_VALUE && (
                    <Input
                      label="Outra unidade de dispensação *"
                      value={formData.dispensingUnitOther}
                      onChange={(e) => setFormData({ ...formData, dispensingUnitOther: e.target.value })}
                      required
                    />
                  )}
                </div>
              </div>

              {/* 🟥 BLOCO 4 — CONTROLE E REGULAÇÃO */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🟥 Controle e Regulação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Classificação Regulatória"
                    value={formData.regulatoryClassification}
                    onChange={(e) => setFormData({ ...formData, regulatoryClassification: e.target.value })}
                    options={REGULATORY_OPTIONS}
                  />
                  <Select
                    label="Associação / Fornecedor"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    options={SUPPLIER_OPTIONS}
                  />
                  {formData.supplier === OTHER_VALUE && (
                    <Input
                      label="Outro fornecedor"
                      value={formData.supplierOther}
                      onChange={(e) => setFormData({ ...formData, supplierOther: e.target.value })}
                    />
                  )}
                  <Input
                    label="Ordem de Exibição"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label className="text-sm text-gray-700">Ativo</label>
                </div>
              </div>

              {/* 🟪 BLOCO 5 — DESCRIÇÃO TÉCNICA */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🟪 Descrição Técnica</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Texto técnico que pode ir direto para a receita..."
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Medicamento
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Lista */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Lista de Medicamentos</h2>
          </div>

          {medications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Pill className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Nenhum medicamento cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CBD/THC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Via</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {medications.map((med, index) => (
                    <motion.tr
                      key={med.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{med.name}</div>
                        {med.description && (
                          <div className="text-sm text-gray-500">{med.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {med.productType || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="text-sm text-gray-900">
                          CBD {med.cbdConcentrationValue} {med.cbdConcentrationUnit === 'MG_PER_ML' ? 'mg/mL' : 'mg/unidade'}
                        </div>
                        <div className="text-xs text-gray-500">
                          THC {med.thcConcentrationValue} {med.thcConcentrationUnit === 'MG_PER_ML' ? 'mg/mL' : 'mg/unidade'} • {med.allowsThc ? 'Permite THC' : 'Sem THC'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {med.administrationRoute || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          med.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {med.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(med)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(med.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
