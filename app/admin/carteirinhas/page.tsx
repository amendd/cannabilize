'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IdCard, CheckCircle, XCircle, Clock, Search, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface PatientCardData {
  id: string;
  cardNumber: string | null;
  qrCodeUrl?: string | null;
  qrCodeData?: string | null;
  approvalStatus: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
    cpf: string | null;
    phone: string | null;
    image?: string | null;
  };
  activePrescription: {
    id: string;
    issuedAt: string;
    expiresAt: string | null;
    doctor: {
      name: string;
      crm: string;
    };
  } | null;
}

export default function AdminCarteirinhasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<PatientCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<PatientCardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchCards();
    }
  }, [session, filter]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const url = filter !== 'all' 
        ? `/api/admin/patient-cards?approvalStatus=${filter}`
        : '/api/admin/patient-cards';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar carteirinhas');
      
      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error('Erro ao buscar carteirinhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (cardId: string) => {
    try {
      setProcessing(cardId);
      const response = await fetch(`/api/admin/patient-cards/${cardId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao aprovar carteirinha');
      }

      await fetchCards();
      alert('Carteirinha aprovada e gerada com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao aprovar carteirinha');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (cardId: string) => {
    const reason = prompt('Digite o motivo da rejeição (opcional):');
    if (reason === null) return; // Usuário cancelou

    try {
      setProcessing(cardId);
      const response = await fetch(`/api/admin/patient-cards/${cardId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao rejeitar carteirinha');
      }

      await fetchCards();
      alert('Carteirinha rejeitada com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao rejeitar carteirinha');
    } finally {
      setProcessing(null);
    }
  };

  const downloadQrPng = (card: PatientCardData) => {
    if (!card.qrCodeUrl) return;

    const safeCardNumber = card.cardNumber || card.id;
    const link = document.createElement('a');
    link.href = card.qrCodeUrl;
    link.download = `carteirinha-qr-${safeCardNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCardPdf = (card: PatientCardData) => {
    // Criar PDF em formato de cartão (paisagem)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [320, 200] });

    const width = 320;
    const height = 200;

    // Fundo geral
    doc.setFillColor(230, 244, 239);
    doc.roundedRect(8, 8, width - 16, height - 16, 10, 10, 'F');

    // Faixa superior azul
    doc.setFillColor(11, 40, 85);
    doc.roundedRect(16, 18, width - 32, 32, 8, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      'PACIENTE REGISTRADO DE CANNABIS MEDICINAL',
      24,
      38
    );

    doc.setFontSize(10);
    const title = 'CANNA ID';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, width - 24 - titleWidth, 38);

    // Faixa lateral com número
    doc.setFillColor(186, 230, 201);
    doc.roundedRect(24, 58, 40, height - 66, 8, 8, 'F');
    doc.setTextColor(12, 63, 39);
    doc.setFontSize(7);
    doc.text('Nº DE REGISTRO', 28, 72);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const cardNumber = card.cardNumber || '—';
    const lines = doc.splitTextToSize(cardNumber, 32);
    doc.text(lines as string[], 28, 90);

    // Foto
    const photoX = 74;
    const photoY = 70;
    const photoW = 80;
    const photoH = 96;
    doc.setDrawColor(180, 215, 190);
    doc.setLineWidth(1);
    doc.roundedRect(photoX, photoY, photoW, photoH, 6, 6, 'S');

    // Não temos a foto diretamente aqui; o QR é a única imagem confiável
    // então deixamos o quadro em branco para impressão física

    // Dados textuais à direita
    const baseX = photoX + photoW + 16;
    let y = 80;
    doc.setTextColor(66, 82, 110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    const label = (text: string, value: string) => {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(text.toUpperCase(), baseX, y);
      y += 10;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(value || '—', baseX, y);
      y += 12;
      doc.setFontSize(7);
    };

    label('Nome', card.patient.name);
    label('CPF', card.patient.cpf || '—');
    label(
      'Data de nascimento',
      card.issuedAt
        ? (card as any).patient?.birthDate
          ? new Date((card as any).patient.birthDate as any).toLocaleDateString('pt-BR')
          : '—'
        : '—'
    );
    label('Nacionalidade', 'BRASILEIRO(A)');
    label('Tipo', 'PACIENTE');

    // Validade e datas no rodapé
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const bottomY = height - 30;
    doc.text(
      `Emitida em: ${
        card.issuedAt ? new Date(card.issuedAt).toLocaleDateString('pt-BR') : '—'
      }`,
      32,
      bottomY
    );
    doc.text(
      `Validade: ${
        card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('pt-BR') : '—'
      }`,
      32,
      bottomY + 11
    );

    // QR code no canto direito
    if (card.qrCodeUrl) {
      const qrSize = 56;
      const qrX = width - qrSize - 32;
      const qrY = height - qrSize - 40;
      doc.addImage(card.qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Escaneie para validar', qrX, qrY - 4);
    }

    const safeCardNumber = card.cardNumber || card.id;
    doc.save(`carteirinha-${safeCardNumber}.pdf`);
  };

  const filteredCards = cards.filter(card => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      card.patient.name.toLowerCase().includes(term) ||
      card.patient.email.toLowerCase().includes(term) ||
      (card.patient.cpf && card.patient.cpf.includes(term)) ||
      (card.cardNumber && card.cardNumber.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (card: PatientCardData) => {
    if (card.approvalStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          <Clock size={14} />
          Pendente
        </span>
      );
    } else if (card.approvalStatus === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle size={14} />
          Aprovada
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <XCircle size={14} />
          Rejeitada
        </span>
      );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') return null;

  const pendingCount = cards.filter(c => c.approvalStatus === 'PENDING').length;
  const approvedCount = cards.filter(c => c.approvalStatus === 'APPROVED').length;
  const rejectedCount = cards.filter(c => c.approvalStatus === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <IdCard className="text-green-600" size={32} />
            Gestão de Carteirinhas Digitais
          </h1>
          <p className="text-gray-600 mt-2">Gerencie as solicitações e aprovações de carteirinhas</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
              </div>
              <IdCard className="text-gray-400" size={32} />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Aprovadas</p>
                <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Rejeitadas</p>
                <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, CPF ou número da carteirinha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'PENDING'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'APPROVED'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aprovadas
              </button>
              <button
                onClick={() => setFilter('REJECTED')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'REJECTED'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejeitadas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Carteirinhas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center">
              <IdCard className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Nenhuma carteirinha encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{card.patient.name}</p>
                          <p className="text-sm text-gray-500">{card.patient.email}</p>
                          {card.patient.cpf && (
                            <p className="text-xs text-gray-400">CPF: {card.patient.cpf}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {card.activePrescription ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {card.activePrescription.doctor.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              CRM: {card.activePrescription.doctor.crm}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(card.activePrescription.issuedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sem receita</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(card)}
                        {card.cardNumber && (
                          <p className="text-xs text-gray-500 mt-1">{card.cardNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(card.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {card.approvalStatus === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(card.id)}
                              disabled={processing === card.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                              <CheckCircle size={16} />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(card.id)}
                              disabled={processing === card.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {card.approvalStatus === 'APPROVED' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedCard(card)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                              <Eye size={16} />
                              Ver
                            </button>
                            <button
                              onClick={() => downloadQrPng(card)}
                              disabled={!card.qrCodeUrl}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              <Download size={16} />
                              QR
                            </button>
                            <button
                              onClick={() => downloadCardPdf(card)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <Download size={16} />
                              PDF
                            </button>
                          </div>
                        )}
                        {card.approvalStatus === 'REJECTED' && (
                          <div>
                            <span className="text-red-600 text-sm block">Rejeitada</span>
                            {card.rejectionReason && (
                              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                {card.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualização */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            // Fechar ao clicar no overlay (fora do modal)
            if (e.target === e.currentTarget) {
              setSelectedCard(null);
            }
          }}
          onKeyDown={(e) => {
            // Fechar com ESC
            if (e.key === 'Escape') {
              setSelectedCard(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 id="modal-title" className="text-lg font-bold text-gray-900">Carteirinha Gerada</h2>
                <p className="text-sm text-gray-600">{selectedCard.patient.name}</p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                aria-label="Fechar modal"
              >
                Fechar
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Número da Carteirinha</p>
                    <p className="font-mono font-semibold text-gray-900">{selectedCard.cardNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedCard.patient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CPF</p>
                    <p className="text-gray-900">{selectedCard.patient.cpf || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Emitida em</p>
                      <p className="text-gray-900">
                        {selectedCard.issuedAt ? new Date(selectedCard.issuedAt).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Válida até</p>
                      <p className="text-gray-900">
                        {selectedCard.expiresAt ? new Date(selectedCard.expiresAt).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Receita ativa</p>
                    {selectedCard.activePrescription ? (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="text-gray-500">Médico:</span> {selectedCard.activePrescription.doctor.name}
                        </p>
                        <p>
                          <span className="text-gray-500">CRM:</span> {selectedCard.activePrescription.doctor.crm}
                        </p>
                        <p>
                          <span className="text-gray-500">Emissão:</span>{' '}
                          {new Date(selectedCard.activePrescription.issuedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sem receita vinculada</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="bg-gray-50 rounded-xl p-4 w-full flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-3">QR Code de verificação</p>
                    {selectedCard.qrCodeUrl ? (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <img
                          src={selectedCard.qrCodeUrl}
                          alt="QR Code da Carteirinha"
                          className="w-52 h-52"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">QR Code indisponível</p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => downloadQrPng(selectedCard)}
                        disabled={!selectedCard.qrCodeUrl}
                        className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <Download size={18} />
                        Baixar QR
                      </button>
                      <button
                        onClick={() => downloadCardPdf(selectedCard)}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <Download size={18} />
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
