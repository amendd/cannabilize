'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Upload, X, CheckCircle2, User, Mail, Phone, FileText, Briefcase, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const doctorSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  crm: z.string().min(4, 'CRM é obrigatório').refine(
    (val) => /^(CRM|CRM-)?\d+$/i.test(val.replace(/\s/g, '')),
    'Formato inválido. Use: CRM-12345 ou CRM12345'
  ),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  specialization: z.string().min(3, 'Especialização é obrigatória'),
  availability: z.string().optional(),
  photo: z.any().optional(),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

export default function CadastroMedicoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A foto deve ter no máximo 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setValue('photo', undefined);
  };

  const onSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('crm', data.crm);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('specialization', data.specialization);
      if (data.availability) {
        formData.append('availability', data.availability);
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await fetch('/api/doctors/register', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Cadastro realizado com sucesso! Aguarde a aprovação.');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cadastro de Médico Parceiro
          </h1>
          <p className="text-lg text-gray-600">
            Preencha seus dados para se tornar um médico parceiro da Cannabilize
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-8"
        >
          {/* Foto do Perfil */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              <User className="inline w-5 h-5 mr-2" />
              Foto do Perfil
            </label>
            <div className="flex items-center gap-6">
              {photoPreview ? (
                <div className="relative w-32 h-32">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="rounded-full object-cover border-4 border-green-200"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  <Upload size={20} />
                  {photoFile ? 'Alterar Foto' : 'Enviar Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-green-600" />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Dr. João Silva"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  CRM *
                </label>
                <input
                  {...register('crm')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="CRM-12345"
                />
                {errors.crm && (
                  <p className="text-red-500 text-sm mt-1">{errors.crm.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formato: CRM-12345 ou CRM12345
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Telefone/WhatsApp *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-green-600" />
              Dados Profissionais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialização *
                </label>
                <select
                  {...register('specialization')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                >
                  <option value="">Selecione uma especialização</option>
                  <option value="Psiquiatria">Psiquiatria</option>
                  <option value="Neurologia">Neurologia</option>
                  <option value="Clínica Médica">Clínica Médica</option>
                  <option value="Oncologia">Oncologia</option>
                  <option value="Pediatria">Pediatria</option>
                  <option value="Geriatria">Geriatria</option>
                  <option value="Medicina da Dor">Medicina da Dor</option>
                  <option value="Medicina Integrativa">Medicina Integrativa</option>
                  <option value="Outra">Outra</option>
                </select>
                {errors.specialization && (
                  <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Disponibilidade
                </label>
                <input
                  {...register('availability')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Ex: Segunda a Sexta, 8h às 18h"
                />
                {errors.availability && (
                  <p className="text-red-500 text-sm mt-1">{errors.availability.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Termos */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Ao se cadastrar, você concorda que:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Seus dados serão verificados pela nossa equipe</li>
                  <li>Você receberá um email de confirmação após a aprovação</li>
                  <li>Será necessário participar de um treinamento sobre fitocanabinoides</li>
                  <li>Você está ciente das responsabilidades éticas e legais</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Enviar Cadastro
                </>
              )}
            </button>
          </div>
        </form>

        {/* Ajuda */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Precisa de ajuda?{' '}
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Entre em contato pelo WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
