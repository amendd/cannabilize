'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, Mail, CheckCircle, Upload, FileText, X, Download } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn, useSession } from 'next-auth/react';

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const { status: authStatus } = useSession();
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [claiming, setClaiming] = useState(false);

  const loadFiles = async () => {
    if (!consultationId) return;
    try {
      const response = await fetch(`/api/consultations/${consultationId}/public/upload`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  useEffect(() => {
    if (consultationId) {
      fetch(`/api/consultations/${consultationId}/public`)
        .then(res => res.json())
        .then(data => {
          setConsultation(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
      
      // Carregar arquivos já enviados
      loadFiles();
    }
  }, [consultationId]);

  // Se já estiver logado, ir direto para a tela da consulta
  useEffect(() => {
    if (authStatus === 'authenticated' && consultationId) {
      router.replace(`/paciente/consultas/${consultationId}`);
    }
  }, [authStatus, consultationId, router]);

  const handleClaimAndLogin = async () => {
    if (!consultationId) return;
    if (!consultation?.email) {
      toast.error('Email da consulta não encontrado.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== password2) {
      toast.error('As senhas não conferem.');
      return;
    }
    const cpfDigits = (cpf || '').replace(/\D/g, '');
    if (cpfDigits.length < 11) {
      toast.error('Informe um CPF válido.');
      return;
    }

    setClaiming(true);
    try {
      // 1) Definir senha de forma segura (pós-pagamento + validação CPF)
      const resp = await fetch('/api/auth/claim-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          email: consultation.email,
          cpf: cpfDigits,
          password,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast.error(data.error || 'Não foi possível concluir o cadastro.');
        return;
      }

      // 2) Fazer login automático e ir direto para a consulta
      const result = await signIn('credentials', {
        email: consultation.email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Senha definida, mas não foi possível fazer login automaticamente. Faça login manualmente.');
        router.push(`/login?callbackUrl=${encodeURIComponent(`/paciente/consultas/${consultationId}`)}`);
        return;
      }

      router.push(`/paciente/consultas/${consultationId}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao finalizar acesso. Tente novamente.');
    } finally {
      setClaiming(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC/DOCX');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Determinar tipo de arquivo baseado no nome
    let fileType = 'OTHER';
    const fileName = file.name.toLowerCase();
    if (fileName.includes('receita') || fileName.includes('prescrição')) {
      fileType = 'PRESCRIPTION';
    } else if (fileName.includes('laudo') || fileName.includes('exame')) {
      fileType = 'EXAM';
    } else if (fileName.includes('relatório')) {
      fileType = 'REPORT';
    }
    
    formData.append('fileType', fileType);
    formData.append('description', '');

    try {
      const response = await fetch(`/api/consultations/${consultationId}/public/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Documento enviado com sucesso!');
        loadFiles();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar documento');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do documento');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Consulta não encontrada</div>
      </div>
    );
  }

  // Formatar data e horário
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Data não informada';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Horário não informado';
    return timeString;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header com Ícone de Sucesso */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Consulta Agendada com Sucesso!
            </h1>
            <p className="text-green-100 text-lg">
              Seu pagamento foi confirmado e sua consulta está agendada
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Informações da Consulta */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Detalhes da Sua Consulta
              </h2>
              
              <div className="space-y-4">
                {/* Data e Horário */}
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Data da Consulta</p>
                      <p className="text-xl font-bold text-gray-900 capitalize">
                        {formatDate(consultation.scheduledDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Horário</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatTime(consultation.scheduledTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações do Paciente */}
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Paciente</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {consultation.name || consultation.patient?.name || 'Nome não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Upload de Documentos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📎 Enviar Documentos (Opcional)
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <p className="text-gray-700 mb-4">
                  Se desejar, você já pode anexar documentos como receitas, laudos ou exames relacionados à sua consulta. 
                  Isso ajudará o médico a ter uma visão mais completa do seu caso.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                
                <button
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={18} />
                  {uploading ? 'Enviando...' : 'Selecionar Documento'}
                </button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máximo 10MB por arquivo)
                </p>
              </div>

              {/* Lista de Arquivos Enviados */}
              {files.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Documentos Enviados ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText size={18} className="text-primary" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{file.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {file.fileType} • {formatFileSize(file.fileSize || 0)} • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/consultations/${consultationId}/public/files/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <Download size={14} />
                          Ver
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Orientações */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📋 Orientações Importantes
              </h2>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">1.</span>
                  <div>
                    <p className="font-semibold text-gray-900">Compareça no horário agendado</p>
                    <p className="text-gray-700">
                      Chegue com 10 minutos de antecedência para o melhor atendimento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">2.</span>
                  <div>
                    <p className="font-semibold text-gray-900">Documentos necessários</p>
                    <p className="text-gray-700">
                      Traga um documento de identidade com foto e, se possível, exames anteriores relacionados à sua condição.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">3.</span>
                  <div>
                    <p className="font-semibold text-gray-900">Medicamentos em uso</p>
                    <p className="text-gray-700">
                      Anote ou traga a lista de medicamentos que você está tomando atualmente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">4.</span>
                  <div>
                    <p className="font-semibold text-gray-900">Cancelamento ou remarcação</p>
                    <p className="text-gray-700">
                      Em caso de necessidade de cancelar ou remarcar, entre em contato com pelo menos 24 horas de antecedência.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Informações de Contato */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📞 Precisa de Ajuda?
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold text-gray-900">(00) 00000-0000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">contato@cannalize.com</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <div className="flex-1">
                {consultation?.payment?.status === 'PAID' ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-1">Acessar sua conta agora</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Crie uma senha (confirmando seu CPF) e você já será direcionado para a tela da sua consulta.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          value={consultation.email}
                          readOnly
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                        <input
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                          <input
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleClaimAndLogin}
                        disabled={claiming}
                        className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claiming ? 'Acessando...' : 'Entrar e ver minha consulta'}
                      </button>

                      <div className="text-xs text-gray-500">
                        Se você já tem senha, use o login:{" "}
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(`/paciente/consultas/${consultationId}`)}`}
                          className="text-primary hover:underline font-medium"
                        >
                          ir para login
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="block bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-primary-dark transition"
                  >
                    Fazer login
                  </Link>
                )}
              </div>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 transition"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>

        {/* Aviso Final */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            <strong>💡 Lembrete:</strong> Você receberá um lembrete por email 24 horas antes da sua consulta.
          </p>
        </div>
      </div>
    </div>
  );
}
