'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PrescriptionFormProps {
  consultationId: string;
}

interface Medication {
  id: string;
  name: string;
  productType?: string;
  cbdConcentrationValue?: number;
  cbdConcentrationUnit?: string;
  thcConcentrationValue?: number;
  thcConcentrationUnit?: string;
  spectrum?: string;
  administrationRoute?: string;
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
  }>;
  observations: string;
}

export default function PrescriptionForm({ consultationId }: PrescriptionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(true);
  
  const { register, handleSubmit, formState: { errors }, control, watch } = useForm<PrescriptionData>({
    defaultValues: {
      medications: [{ medicationId: '', medicationName: '', productType: '', composition: '', spectrum: '', route: '', quantity: '', dosage: '', instructions: '' }],
      observations: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  useEffect(() => {
    loadMedications();
  }, []);

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

  const handleMedicationSelect = (index: number, medicationId: string) => {
    const medication = availableMedications.find(m => m.id === medicationId);
    if (medication) {
      const currentMedications = watch('medications');
      currentMedications[index].medicationId = medication.id;
      currentMedications[index].medicationName = medication.name;
      const unitLabel = (u?: string) => (u === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL');
      const cbd = typeof medication.cbdConcentrationValue === 'number' ? `${medication.cbdConcentrationValue} ${unitLabel(medication.cbdConcentrationUnit)}` : '';
      const thcVal = typeof medication.thcConcentrationValue === 'number' ? medication.thcConcentrationValue : 0;
      const thc = `${thcVal} ${unitLabel(medication.thcConcentrationUnit)}`;
      const composition = cbd ? `CBD ${cbd} / THC ${thc}` : '';
      currentMedications[index].productType = medication.productType || '';
      currentMedications[index].composition = composition;
      currentMedications[index].spectrum = medication.spectrum || '';
      currentMedications[index].route = medication.administrationRoute || '';
    }
  };

  const onSubmit = async (data: PrescriptionData) => {
    // Validar que pelo menos um medicamento foi selecionado
    const hasMedications = data.medications.some(m => m.medicationId && m.medicationName);
    if (!hasMedications) {
      toast.error('Selecione pelo menos um medicamento');
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

      toast.success('Receita emitida com sucesso!');
      // Após emitir a receita, redirecionar para a página da consulta,
      // em vez de recarregar toda a página.
      router.push(`/admin/consultas/${consultationId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao emitir receita');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Pill className="text-primary" size={24} />
        Emitir Receita Médica
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Medicamentos
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  medicationId: '',
                  medicationName: '',
                  productType: '',
                  composition: '',
                  spectrum: '',
                  route: '',
                  quantity: '',
                  dosage: '',
                  instructions: '',
                })
              }
            >
              <Plus size={16} />
              Adicionar Medicamento
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Medicamento {index + 1}</span>
                  {fields.length > 1 && (
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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
                    <input type="hidden" {...register(`medications.${index}.productType`)} />
                    <input type="hidden" {...register(`medications.${index}.composition`)} />
                    <input type="hidden" {...register(`medications.${index}.spectrum`)} />
                    <input type="hidden" {...register(`medications.${index}.route`)} />
                  </div>
                  
                  <Input
                    label="Quantidade"
                    {...register(`medications.${index}.quantity`)}
                    placeholder="Ex: 30 comprimidos, 1 frasco"
                  />
                  
                  <Input
                    label="Dosagem *"
                    {...register(`medications.${index}.dosage`, { required: true })}
                    placeholder="Ex: 1 comprimido 2x ao dia"
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instruções Adicionais
                    </label>
                    <textarea
                      {...register(`medications.${index}.instructions`)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Instruções específicas para este medicamento..."
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações Gerais
          </label>
          <textarea
            {...register('observations')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="Observações adicionais sobre a prescrição..."
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            Emitir Receita
          </Button>
        </div>
      </form>
    </div>
  );
}
