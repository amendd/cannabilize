// CID-10 codes commonly used for medical cannabis prescriptions
// Based on WHO ICD-10 classification

export interface CID10Code {
  code: string;
  description: string;
  category: string;
}

export const CID10_CODES: CID10Code[] = [
  // Dor e condições relacionadas
  { code: 'G50.9', description: 'Neuralgia do trigêmeo não especificada', category: 'Dor Neuropática' },
  { code: 'G54.0', description: 'Lesões do plexo braquial', category: 'Dor Neuropática' },
  { code: 'G54.1', description: 'Lesões do plexo lombossacral', category: 'Dor Neuropática' },
  { code: 'G54.2', description: 'Lesões das raízes nervosas cervicais', category: 'Dor Neuropática' },
  { code: 'G54.3', description: 'Lesões das raízes nervosas torácicas', category: 'Dor Neuropática' },
  { code: 'G54.4', description: 'Lesões das raízes nervosas lombossacrais', category: 'Dor Neuropática' },
  { code: 'G90.0', description: 'Neuropatia autonômica idiopática', category: 'Dor Neuropática' },
  { code: 'M79.3', description: 'Paniculite', category: 'Dor Crônica' },
  { code: 'M79.4', description: 'Hipertrofia do coxim gorduroso', category: 'Dor Crônica' },
  { code: 'R52.0', description: 'Dor aguda', category: 'Dor' },
  { code: 'R52.1', description: 'Dor crônica intratável', category: 'Dor Crônica' },
  { code: 'R52.2', description: 'Outra dor crônica', category: 'Dor Crônica' },
  { code: 'R52.9', description: 'Dor não especificada', category: 'Dor' },

  // Epilepsia e convulsões
  { code: 'G40.0', description: 'Epilepsia localizada (focal) (parcial) idiopática com crises parciais', category: 'Epilepsia' },
  { code: 'G40.1', description: 'Epilepsia localizada (focal) (parcial) sintomática com crises parciais simples', category: 'Epilepsia' },
  { code: 'G40.2', description: 'Epilepsia localizada (focal) (parcial) sintomática com crises parciais complexas', category: 'Epilepsia' },
  { code: 'G40.3', description: 'Epilepsia generalizada idiopática', category: 'Epilepsia' },
  { code: 'G40.4', description: 'Outras epilepsias generalizadas', category: 'Epilepsia' },
  { code: 'G40.5', description: 'Epilepsias e síndromes epilépticas especiais', category: 'Epilepsia' },
  { code: 'G40.6', description: 'Crises de grande mal não especificadas (com ou sem pequeno mal)', category: 'Epilepsia' },
  { code: 'G40.7', description: 'Pequeno mal não especificado, sem grande mal', category: 'Epilepsia' },
  { code: 'G40.8', description: 'Outras epilepsias', category: 'Epilepsia' },
  { code: 'G40.9', description: 'Epilepsia não especificada', category: 'Epilepsia' },
  { code: 'G41.0', description: 'Estado de mal epiléptico generalizado (convulsivo)', category: 'Epilepsia' },
  { code: 'G41.1', description: 'Estado de mal epiléptico parcial', category: 'Epilepsia' },
  { code: 'G41.2', description: 'Estado de mal epiléptico sutil', category: 'Epilepsia' },
  { code: 'G41.8', description: 'Outro estado de mal epiléptico', category: 'Epilepsia' },
  { code: 'G41.9', description: 'Estado de mal epiléptico não especificado', category: 'Epilepsia' },

  // Ansiedade e transtornos mentais
  { code: 'F41.0', description: 'Transtorno de pânico [ansiedade paroxística episódica]', category: 'Ansiedade' },
  { code: 'F41.1', description: 'Ansiedade generalizada', category: 'Ansiedade' },
  { code: 'F41.2', description: 'Transtorno misto ansioso e depressivo', category: 'Ansiedade' },
  { code: 'F41.3', description: 'Outros transtornos ansiosos mistos', category: 'Ansiedade' },
  { code: 'F41.8', description: 'Outros transtornos ansiosos especificados', category: 'Ansiedade' },
  { code: 'F41.9', description: 'Transtorno ansioso não especificado', category: 'Ansiedade' },
  { code: 'F32.0', description: 'Episódio depressivo leve', category: 'Depressão' },
  { code: 'F32.1', description: 'Episódio depressivo moderado', category: 'Depressão' },
  { code: 'F32.2', description: 'Episódio depressivo grave sem sintomas psicóticos', category: 'Depressão' },
  { code: 'F32.3', description: 'Episódio depressivo grave com sintomas psicóticos', category: 'Depressão' },
  { code: 'F32.8', description: 'Outros episódios depressivos', category: 'Depressão' },
  { code: 'F32.9', description: 'Episódio depressivo não especificado', category: 'Depressão' },
  { code: 'F33.0', description: 'Transtorno depressivo recorrente, episódio atual leve', category: 'Depressão' },
  { code: 'F33.1', description: 'Transtorno depressivo recorrente, episódio atual moderado', category: 'Depressão' },
  { code: 'F33.2', description: 'Transtorno depressivo recorrente, episódio atual grave sem sintomas psicóticos', category: 'Depressão' },
  { code: 'F33.3', description: 'Transtorno depressivo recorrente, episódio atual grave com sintomas psicóticos', category: 'Depressão' },
  { code: 'F33.4', description: 'Transtorno depressivo recorrente, atualmente em remissão', category: 'Depressão' },
  { code: 'F33.8', description: 'Outros transtornos depressivos recorrentes', category: 'Depressão' },
  { code: 'F33.9', description: 'Transtorno depressivo recorrente não especificado', category: 'Depressão' },

  // Transtorno de estresse pós-traumático
  { code: 'F43.1', description: 'Reação de estresse pós-traumático', category: 'TEPT' },
  { code: 'F43.2', description: 'Reações de adaptação', category: 'TEPT' },
  { code: 'F43.8', description: 'Outras reações ao estresse grave', category: 'TEPT' },
  { code: 'F43.9', description: 'Reação ao estresse grave não especificada', category: 'TEPT' },

  // Esclerose múltipla
  { code: 'G35', description: 'Esclerose múltipla', category: 'Esclerose Múltipla' },
  { code: 'G35.0', description: 'Esclerose múltipla forma remitente-recorrente', category: 'Esclerose Múltipla' },
  { code: 'G35.1', description: 'Esclerose múltipla forma progressiva primária', category: 'Esclerose Múltipla' },
  { code: 'G35.2', description: 'Esclerose múltipla forma progressiva secundária', category: 'Esclerose Múltipla' },
  { code: 'G35.9', description: 'Esclerose múltipla não especificada', category: 'Esclerose Múltipla' },

  // Parkinson
  { code: 'G20', description: 'Doença de Parkinson', category: 'Parkinson' },
  { code: 'G21.0', description: 'Parkinsonismo maligno', category: 'Parkinson' },
  { code: 'G21.1', description: 'Outro parkinsonismo secundário induzido por drogas', category: 'Parkinson' },
  { code: 'G21.2', description: 'Parkinsonismo secundário devido a outro agente externo', category: 'Parkinson' },
  { code: 'G21.3', description: 'Parkinsonismo pós-encefalítico', category: 'Parkinson' },
  { code: 'G21.8', description: 'Outro parkinsonismo secundário', category: 'Parkinson' },
  { code: 'G21.9', description: 'Parkinsonismo secundário não especificado', category: 'Parkinson' },

  // Câncer e cuidados paliativos
  { code: 'C80.9', description: 'Neoplasia maligna sem especificação de localização', category: 'Oncologia' },
  { code: 'Z51.1', description: 'Sessão de quimioterapia para neoplasia', category: 'Oncologia' },
  { code: 'Z51.2', description: 'Outra quimioterapia', category: 'Oncologia' },
  { code: 'Z51.3', description: 'Transfusão de sangue sem diagnóstico relatado', category: 'Oncologia' },
  { code: 'Z51.4', description: 'Cuidados preparatórios para tratamento subsequente não classificado em outra parte', category: 'Oncologia' },
  { code: 'Z51.5', description: 'Cuidados paliativos', category: 'Oncologia' },
  { code: 'Z51.8', description: 'Outra atenção médica especificada', category: 'Oncologia' },
  { code: 'Z51.9', description: 'Atenção médica não especificada', category: 'Oncologia' },

  // Fibromialgia
  { code: 'M79.3', description: 'Paniculite', category: 'Fibromialgia' },
  { code: 'M79.0', description: 'Reumatismo não especificado', category: 'Fibromialgia' },
  { code: 'M79.1', description: 'Mialgia', category: 'Fibromialgia' },
  { code: 'M79.2', description: 'Neuralgia e neurite não especificadas', category: 'Fibromialgia' },

  // Enxaqueca
  { code: 'G43.0', description: 'Enxaqueca sem aura [enxaqueca comum]', category: 'Enxaqueca' },
  { code: 'G43.1', description: 'Enxaqueca com aura [enxaqueca clássica]', category: 'Enxaqueca' },
  { code: 'G43.2', description: 'Estado de mal enxaquecoso', category: 'Enxaqueca' },
  { code: 'G43.3', description: 'Enxaqueca complicada', category: 'Enxaqueca' },
  { code: 'G43.8', description: 'Outra enxaqueca', category: 'Enxaqueca' },
  { code: 'G43.9', description: 'Enxaqueca não especificada', category: 'Enxaqueca' },

  // Transtorno do espectro autista
  { code: 'F84.0', description: 'Autismo infantil', category: 'TEA' },
  { code: 'F84.1', description: 'Autismo atípico', category: 'TEA' },
  { code: 'F84.2', description: 'Síndrome de Rett', category: 'TEA' },
  { code: 'F84.3', description: 'Outro transtorno desintegrativo da infância', category: 'TEA' },
  { code: 'F84.4', description: 'Transtorno com hipercinesia associada a retardo mental e a movimentos estereotipados', category: 'TEA' },
  { code: 'F84.5', description: 'Síndrome de Asperger', category: 'TEA' },
  { code: 'F84.8', description: 'Outros transtornos globais do desenvolvimento', category: 'TEA' },
  { code: 'F84.9', description: 'Transtornos globais não especificados do desenvolvimento', category: 'TEA' },

  // Insônia
  { code: 'G47.0', description: 'Distúrbios do início e da manutenção do sono [insônia]', category: 'Sono' },
  { code: 'G47.1', description: 'Distúrbios do sono por sonolência excessiva [hipersonia]', category: 'Sono' },
  { code: 'G47.2', description: 'Distúrbios do ciclo sono-vigília', category: 'Sono' },
  { code: 'G47.3', description: 'Apneia do sono', category: 'Sono' },
  { code: 'G47.4', description: 'Narcolepsia e cataplexia', category: 'Sono' },
  { code: 'G47.8', description: 'Outros distúrbios do sono', category: 'Sono' },
  { code: 'G47.9', description: 'Distúrbio do sono não especificado', category: 'Sono' },

  // Glaucoma
  { code: 'H40.0', description: 'Glaucoma suspeito', category: 'Glaucoma' },
  { code: 'H40.1', description: 'Glaucoma primário de ângulo aberto', category: 'Glaucoma' },
  { code: 'H40.2', description: 'Glaucoma primário de ângulo fechado', category: 'Glaucoma' },
  { code: 'H40.3', description: 'Glaucoma secundário pós-traumático', category: 'Glaucoma' },
  { code: 'H40.4', description: 'Glaucoma secundário a doença inflamatória do olho', category: 'Glaucoma' },
  { code: 'H40.5', description: 'Glaucoma secundário a outros transtornos do olho', category: 'Glaucoma' },
  { code: 'H40.6', description: 'Glaucoma secundário a drogas', category: 'Glaucoma' },
  { code: 'H40.8', description: 'Outro glaucoma', category: 'Glaucoma' },
  { code: 'H40.9', description: 'Glaucoma não especificado', category: 'Glaucoma' },

  // Síndrome de Tourette
  { code: 'F95.0', description: 'Transtorno de tique transitório', category: 'Tourette' },
  { code: 'F95.1', description: 'Transtorno de tique crônico motor ou vocal', category: 'Tourette' },
  { code: 'F95.2', description: 'Transtorno de tique combinado vocal e motor múltiplo [síndrome de Gilles de la Tourette]', category: 'Tourette' },
  { code: 'F95.8', description: 'Outros transtornos de tique', category: 'Tourette' },
  { code: 'F95.9', description: 'Transtorno de tique não especificado', category: 'Tourette' },
];

/**
 * Busca códigos CID-10 por código ou descrição
 */
export function searchCID10(query: string): CID10Code[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  return CID10_CODES.filter(code => {
    const codeMatch = code.code.toLowerCase().includes(normalizedQuery);
    const descMatch = code.description.toLowerCase().includes(normalizedQuery);
    const categoryMatch = code.category.toLowerCase().includes(normalizedQuery);
    
    return codeMatch || descMatch || categoryMatch;
  }).slice(0, 50); // Limitar a 50 resultados
}

/**
 * Busca um código CID-10 específico
 */
export function findCID10ByCode(code: string): CID10Code | undefined {
  return CID10_CODES.find(c => c.code === code);
}
