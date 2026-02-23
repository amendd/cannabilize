'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pill, Save, FileText, CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CID10MultiSelector from '@/components/medico/CID10MultiSelector';

interface PrescriptionBuilderProps {
  consultationId: string;
  consultationStatus: string;
  existingPrescription?: any;
  onPrescriptionSaved?: () => void;
  /** Se false, o botão "Finalizar e Emitir Receita" fica desabilitado até o médico marcar que a chamada por vídeo foi encerrada. */
  allowEmitPrescription?: boolean;
}

interface Medication {
  id: string;
  name: string;
  productType?: string;
  pharmaceuticalForm?: string;
  activePrinciples?: string[];
  cbdConcentrationValue?: number;
  cbdConcentrationUnit?: string;
  thcConcentrationValue?: number;
  thcConcentrationUnit?: string;
  spectrum?: string;
  administrationRoute?: string;
  dispensingUnit?: string;
}

interface PrescriptionData {
  medications: Array<{
    medicationId: string;
    medicationName: string;
    productType?: string;
    composition?: string;
    spectrum?: string;
    route?: string;
    quantity?: string;
    dosage?: string;
    instructions?: string;
    initialDose?: string;
    escalation?: string;
    maxDose?: string;
    suggestedTimes?: string;
    duration?: string;
  }>;
  observations: string;
  cid10?: string[];
  diagnosis?: string;
}

export default function PrescriptionBuilder({
  consultationId,
  consultationStatus,
  existingPrescription,
  onPrescriptionSaved,
  allowEmitPrescription = true,
}: PrescriptionBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [prescriptionDraft, setPrescriptionDraft] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, formState: { errors }, control, watch, reset, setValue } = useForm<PrescriptionData>({
    defaultValues: {
      medications: [{ medicationId: '', medicationName: '', productType: '', composition: '', spectrum: '', route: '', quantity: '', dosage: '', instructions: '', initialDose: '', escalation: '', maxDose: '', suggestedTimes: '', duration: '' }],
      observations: '',
      cid10: [],
      diagnosis: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  const watchedMedications = watch('medications');
  const watchedObservations = watch('observations');

  useEffect(() => {
    loadMedications();
    loadDraft();
  }, []);

  useEffect(() => {
    if (existingPrescription) {
      try {
        const data = typeof existingPrescription.prescriptionData === 'string'
          ? JSON.parse(existingPrescription.prescriptionData)
          : existingPrescription.prescriptionData;
        
        if (data.medications && Array.isArray(data.medications) && data.medications.length > 0) {
          const cid10List =
            Array.isArray(data.cid10) ? data.cid10 : data.cid10 ? [data.cid10] : [];
          // Garantir que todos os campos de posologia estejam presentes
          const normalizedMedications = data.medications.map((med: any) => ({
            ...med,
            initialDose: med.initialDose || '',
            escalation: med.escalation || '',
            maxDose: med.maxDose || '',
            suggestedTimes: med.suggestedTimes || '',
            duration: med.duration || '',
          }));
          reset({
            medications: normalizedMedications,
            observations: data.observations || '',
            cid10: cid10List,
            diagnosis: data.diagnosis || '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar receita existente:', error);
      }
    }
  }, [existingPrescription, reset]);

  const loadMedications = async () => {
    try {
      setLoadingMedications(true);
      const response = await fetch('/api/admin/medications');
      if (response.ok) {
        const data = await response.json();
        setAvailableMedications(data.medications || []);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    } finally {
      setLoadingMedications(false);
    }
  };

  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/prescription/draft`);
      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setPrescriptionDraft(data.draft);
          const draftData = typeof data.draft.prescriptionData === 'string'
            ? JSON.parse(data.draft.prescriptionData)
            : data.draft.prescriptionData;
          
          if (draftData.medications && draftData.medications.length > 0) {
            const cid10List =
              Array.isArray(draftData.cid10) ? draftData.cid10 : draftData.cid10 ? [draftData.cid10] : [];
            // Garantir que todos os campos de posologia estejam presentes
            const normalizedMedications = draftData.medications.map((med: any) => ({
              ...med,
              initialDose: med.initialDose || '',
              escalation: med.escalation || '',
              maxDose: med.maxDose || '',
              suggestedTimes: med.suggestedTimes || '',
              duration: med.duration || '',
            }));
            reset({
              medications: normalizedMedications,
              observations: draftData.observations || '',
              cid10: cid10List,
              diagnosis: draftData.diagnosis || '',
            });
            toast.success('Rascunho de receita carregado');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
  };

  const handleMedicationSelect = (index: number, medicationId: string) => {
    const medication = availableMedications.find(m => m.id === medicationId);
    if (medication) {
      setValue(`medications.${index}.medicationId`, medication.id);
      setValue(`medications.${index}.medicationName`, medication.name);

      // Calcular composição completa (incluindo outros canabinoides se houver)
      const unitLabel = (u?: string) => (u === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL');
      const compositionParts: string[] = [];
      
      if (typeof medication.cbdConcentrationValue === 'number' && medication.cbdConcentrationValue > 0) {
        compositionParts.push(`CBD ${medication.cbdConcentrationValue} ${unitLabel(medication.cbdConcentrationUnit)}`);
      }
      
      if (typeof medication.thcConcentrationValue === 'number' && medication.thcConcentrationValue > 0) {
        compositionParts.push(`THC ${medication.thcConcentrationValue} ${unitLabel(medication.thcConcentrationUnit)}`);
      }
      
      // Adicionar outros canabinoides se existirem
      if (medication.otherCannabinoids && Array.isArray(medication.otherCannabinoids)) {
        medication.otherCannabinoids.forEach((cann: any) => {
          if (cann.name && cann.value) {
            const unit = cann.unit === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL';
            compositionParts.push(`${cann.name} ${cann.value} ${unit}`);
          }
        });
      }
      
      const composition = compositionParts.length > 0 ? compositionParts.join(' / ') : '';

      setValue(`medications.${index}.productType`, medication.productType || '');
      setValue(`medications.${index}.composition`, composition);
      setValue(`medications.${index}.spectrum`, medication.spectrum || '');
      setValue(`medications.${index}.route`, medication.administrationRoute || '');
      
      // Sugerir quantity baseado no dispensingUnit
      if (medication.dispensingUnit && !watch(`medications.${index}.quantity`)) {
        setValue(`medications.${index}.quantity`, medication.dispensingUnit);
      }
    }
  };

  const saveDraft = async (data: PrescriptionData) => {
    setIsSavingDraft(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/prescription/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionData: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar rascunho');
      }

      toast.success('Rascunho salvo com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar rascunho');
      console.error(error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: PrescriptionData) => {
    // Validar CID-10
    if (!data.cid10 || data.cid10.length === 0) {
      toast.error('Selecione pelo menos um código CID-10');
      return;
    }

    // Validar que pelo menos um medicamento foi selecionado
    const hasMedications = data.medications.some(m => m.medicationId && m.medicationName);
    if (!hasMedications) {
      toast.error('Selecione pelo menos um medicamento');
      return;
    }

    // Validar que todos os medicamentos têm dosagem e quantidade
    const hasInvalidMedications = data.medications.some(m => 
      m.medicationId && m.medicationName && (!m.dosage || !m.quantity)
    );
    if (hasInvalidMedications) {
      toast.error('Preencha a dosagem e quantidade de todos os medicamentos');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          prescriptionData: data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao emitir receita');
      }

      const result = await response.json();
      toast.success('Receita emitida com sucesso!');
      
      if (onPrescriptionSaved) {
        onPrescriptionSaved();
      }
      
      // Se houver PDF, abrir em nova aba
      if (result.pdfBase64) {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(result.pdfBase64), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao emitir receita');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = consultationStatus === 'IN_PROGRESS' || consultationStatus === 'SCHEDULED';
  const hasPrescription = existingPrescription && existingPrescription.status === 'ISSUED';
  const canEmit = canEdit && allowEmitPrescription;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="text-primary" size={24} />
          Receita Médica
        </h2>
        {hasPrescription && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
            <CheckCircle size={16} />
            Receita Emitida
          </span>
        )}
      </div>

      {hasPrescription ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Receita emitida em:</strong>{' '}
              {new Date(existingPrescription.issuedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {existingPrescription.pdfUrl && (
              <a
                href={existingPrescription.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                <FileText size={18} />
                Ver Receita em PDF
              </a>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!canEdit && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                A consulta precisa estar em andamento para editar a receita.
              </p>
            </div>
          )}

          {/* Seção de Diagnóstico e CID-10 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Diagnóstico e Indicação Clínica</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <CID10MultiSelector
                value={watch('cid10') || []}
                onChange={(codes, lastSelected) => {
                  setValue('cid10', codes);
                  // Preencher diagnóstico automaticamente se estiver vazio
                  if (!watch('diagnosis') && lastSelected?.description) {
                    setValue('diagnosis', lastSelected.description);
                  }
                }}
                disabled={!canEdit}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do Diagnóstico
                </label>
                <textarea
                  {...register('diagnosis')}
                  rows={3}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Descreva a condição clínica, sintomas e indicação para uso medicinal de cannabis..."
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-600">
              <strong>Nota:</strong> O CID-10 é obrigatório e ajuda a garantir a conformidade legal da prescrição.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Medicamentos
              </label>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ medicationId: '', medicationName: '', productType: '', composition: '', spectrum: '', route: '', quantity: '', dosage: '', instructions: '' })}
                >
                  <Plus size={16} />
                  Adicionar Medicamento
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Medicamento {index + 1}</span>
                      {canEdit && fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecionar Medicamento *
                        </label>
                        {loadingMedications ? (
                          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                            Carregando medicamentos...
                          </div>
                        ) : (
                          <select
                            {...register(`medications.${index}.medicationId`, { required: true })}
                            onChange={(e) => handleMedicationSelect(index, e.target.value)}
                            disabled={!canEdit}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Selecione um medicamento</option>
                            {availableMedications.map(med => (
                              <option key={med.id} value={med.id}>
                            {med.name}
                            {med.productType && ` • ${med.productType}`}
                            {typeof med.cbdConcentrationValue === 'number' && ` • CBD ${med.cbdConcentrationValue}`}
                            {typeof med.thcConcentrationValue === 'number' && ` / THC ${med.thcConcentrationValue}`}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="hidden"
                          {...register(`medications.${index}.medicationName`)}
                        />
                        <input
                          type="hidden"
                          {...register(`medications.${index}.productType`)}
                        />
                        <input
                          type="hidden"
                          {...register(`medications.${index}.composition`)}
                        />
                        <input
                          type="hidden"
                          {...register(`medications.${index}.spectrum`)}
                        />
                        <input
                          type="hidden"
                          {...register(`medications.${index}.route`)}
                        />
                      </div>

                      <Input
                        label="Quantidade *"
                        {...register(`medications.${index}.quantity`, { required: true })}
                        placeholder="Ex: 1 frasco de 30mL, 2 frascos de 20mL"
                        disabled={!canEdit}
                      />

                      <Input
                        label="Dosagem *"
                        {...register(`medications.${index}.dosage`, { required: true })}
                        placeholder="Ex: 1 gota 2x ao dia"
                        disabled={!canEdit}
                      />

                      <Input
                        label="Dose Inicial"
                        {...register(`medications.${index}.initialDose`)}
                        placeholder="Ex: 1 gota 1x ao dia"
                        disabled={!canEdit}
                      />

                      <Input
                        label="Dose Máxima Diária"
                        {...register(`medications.${index}.maxDose`)}
                        placeholder="Ex: 5 gotas por dia"
                        disabled={!canEdit}
                      />

                      <Input
                        label="Horários Sugeridos"
                        {...register(`medications.${index}.suggestedTimes`)}
                        placeholder="Ex: Manhã e noite"
                        disabled={!canEdit}
                      />

                      <Input
                        label="Duração do Tratamento"
                        {...register(`medications.${index}.duration`)}
                        placeholder="Ex: 60 dias"
                        disabled={!canEdit}
                      />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Escalonamento
                        </label>
                        <textarea
                          {...register(`medications.${index}.escalation`)}
                          rows={2}
                          disabled={!canEdit}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Ex: Aumentar 1 gota a cada 3 dias até atingir dose ideal"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instruções Adicionais
                        </label>
                        <textarea
                          {...register(`medications.${index}.instructions`)}
                          rows={2}
                          disabled={!canEdit}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Ex: Tomar após as refeições. Manter em local fresco e seco."
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Gerais
            </label>
            <textarea
              {...register('observations')}
              rows={4}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Observações adicionais sobre a prescrição..."
            />
          </div>

          {canEdit && (
            <>
              {!allowEmitPrescription && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                  <XCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-sm text-amber-800">
                    Para emitir a receita, informe antes que a <strong>chamada por vídeo foi encerrada</strong> (botão na área da reunião).
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit(saveDraft)}
                  loading={isSavingDraft}
                  className="flex-1"
                >
                  <Save size={16} />
                  Salvar Rascunho
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!canEmit}
                  className="flex-1"
                  title={!canEmit ? 'Encerre a chamada por vídeo antes de emitir a receita.' : undefined}
                >
                  <CheckCircle size={16} />
                  Finalizar e Emitir Receita
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
