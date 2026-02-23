/**
 * Script para remover arquivos temporários, de teste e documentação redundante
 * Execute: npx tsx remover-arquivos-temporarios.ts
 * 
 * ATENÇÃO: Este script remove arquivos permanentemente!
 * Revise a lista antes de executar.
 */

import fs from 'fs';
import path from 'path';

// Arquivos para remover - ALTA PRIORIDADE (Segurança)
const arquivosAltaPrioridade = [
  // Arquivos com possíveis credenciais
  'CREDENCIAIS_ACESSO.md',
  'CREDENCIAIS_CANNABILIZE.md',
  'GUIA_CREDENCIAIS_GOOGLE_MEET.md',
  'public/GUIA_CREDENCIAIS_GOOGLE_MEET.md',
  'SUPABASE_CONNECTION_STRING.md',
  
  // Scripts de teste duplicados
  'verificar-usuarios.ts',
  'criar-usuarios.ts',
  'testar-login.ts',
  'verificar-login-simples.js',
  'solucao-login-completa.ts',
];

// Arquivos para remover - MÉDIA PRIORIDADE (Problemas resolvidos)
const arquivosMediaPrioridade = [
  // Problemas de Login
  'SOLUCAO_LOGIN.md',
  'SOLUCAO_LOGIN_COMPLETA.md',
  'SOLUCAO_LOGIN_NAO_FUNCIONA.md',
  'POR_QUE_LOGIN_PAROU.md',
  'COMO_INICIAR_SERVIDOR.md',
  
  // Problemas de Erro
  'SOLUCAO_ERRO.md',
  'SOLUCAO_ERRO_EPERM.md',
  'SOLUCAO_ERRO_PRISMA.md',
  'SOLUCAO_ERRO_DEPENDENCIAS.md',
  'SOLUCAO_TABELA_NAO_EXISTE.md',
  'SOLUCAO_PORTA_3000.md',
  'SOLUCAO_POLITICA_POWERSHELL.md',
  'SOLUCAO_FECHA_RAPIDO.md',
  'SOLUCAO_FECHA_RAPIDO_FINAL.md',
  'SOLUCAO_FINAL.md',
  
  // Correções específicas
  'CORRECAO_BOTAO_ADIANTAMENTO.md',
  'CORRECAO_ERRO_ADMIN.md',
  'CORRECAO_ERRO_PAGAMENTO.md',
  'CORRECAO_FLUXO_AGENDAMENTO.md',
  'CORRECAO_HORARIO_2055.md',
  'CORRECAO_VALIDACAO_HORARIO.md',
  'CORRECOES_AGENDAMENTO.md',
  'CORRECOES_COMPLETAS.md',
  'RESUMO_CORRECOES_FINAIS.md',
  'FIX_OVERLAY_EMERGENCY.md',
  'DEBUG_CONVITES_PACIENTE.md',
  'DIAGNOSTICO_DISPONIBILIDADE.md',
];

// Arquivos para remover - BAIXA PRIORIDADE (Redundantes)
const arquivosBaixaPrioridade = [
  // Resumos temporários
  'RESUMO_EXECUTIVO_ANALISE.md',
  'RESUMO_EXECUTIVO_MELHORIAS.md',
  'RESUMO_FINAL.md',
  'FINAL_SUMMARY.md',
  'RESUMO_PRODUCAO.md',
  'RESUMO_ANALISE_DESIGN.md',
  'RESUMO_ANALISE_MELHORIAS.md',
  'RESUMO_IMPLEMENTACAO_DESIGN.md',
  'RESUMO_IMPLEMENTACAO_SEGURANCA.md',
  'RESUMO_IMPLEMENTACAO_CONVITES.md',
  'RESUMO_CONVITES_ADIANTAMENTO.md',
  
  // Análises temporárias
  'ANALISE_LAYOUT_DESIGN_UI_UX.md',
  'ANALISE_COMPLETA_MELHORIAS.md',
  'ANALISE_PRODUCAO.md',
  'ANALISE_GERAL_PROJETO.md',
  'ANALISE_MELHORIAS_PROJETO.md',
  'ANALISE_UI_UX_CONSULTA_MEDICO.md',
  
  // Melhorias implementadas
  'MELHORIAS_IMPLEMENTADAS.md',
  'MELHORIAS_IMPLEMENTADAS_DESIGN.md',
  'MELHORIAS_IMPLEMENTADAS_SESSAO.md',
  'MELHORIAS_APLICADAS_SESSAO.md',
  'MELHORIAS_V2_PAGINA_CONSULTA.md',
  'MELHORIAS_DISPONIBILIDADE_E_ERROS.md',
  'MELHORIAS_FINAIS_CONVITES.md',
  'INOVACOES_E_MELHORIAS.md',
  'TOP_10_INOVACOES.md',
  'EXEMPLOS_MELHORIAS_PRATICAS.md',
  'EXEMPLOS_IMPLEMENTACAO_MELHORIAS.md',
  
  // Implementações concluídas
  'IMPLEMENTACAO_COMPLETA.md',
  'IMPLEMENTACAO_COMPLETA_TELEMEDICINA.md',
  'IMPLEMENTACAO_TELEMEDICINA.md',
  'IMPLEMENTACAO_AGENDAMENTO_MEDICO_ONLINE.md',
  'IMPLEMENTACAO_CONSULTA_COMPLETA.md',
  'IMPLEMENTACAO_CONVITES_ADIANTAMENTO.md',
  'IMPLEMENTACAO_CONFIGURACAO_RECAPTCHA.md',
  'IMPLEMENTACOES_RECENTES.md',
  'MIGRACAO_CONCLUIDA.md',
  'ALTERACOES_REALIZADAS.md',
  
  // Guias redundantes
  'LEIA_ME.txt',
  'LEIA_ME_PRIMEIRO.txt',
  'README_EXECUCAO.md',
  'README_INICIO_RAPIDO.md',
  'COMO_EXECUTAR.md',
  'INSTRUCOES_FINAIS.md',
  'INSTRUCOES_MIGRACAO.md',
  
  // Arquivos temporários
  'SCHEMA_CORRIGIDO.txt',
  
  // Scripts PowerShell
  'iniciar.ps1',
];

interface RemocaoResultado {
  removidos: string[];
  naoEncontrados: string[];
  erros: Array<{ arquivo: string; erro: string }>;
}

function removerArquivos(listaArquivos: string[], prioridade: string): RemocaoResultado {
  const resultado: RemocaoResultado = {
    removidos: [],
    naoEncontrados: [],
    erros: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗑️  Removendo arquivos - ${prioridade}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const arquivo of listaArquivos) {
    const caminhoCompleto = path.join(process.cwd(), arquivo);
    
    try {
      if (fs.existsSync(caminhoCompleto)) {
        fs.unlinkSync(caminhoCompleto);
        resultado.removidos.push(arquivo);
        console.log(`✅ Removido: ${arquivo}`);
      } else {
        resultado.naoEncontrados.push(arquivo);
        console.log(`⚠️  Não encontrado: ${arquivo}`);
      }
    } catch (error: any) {
      resultado.erros.push({ arquivo, erro: error.message });
      console.log(`❌ Erro ao remover ${arquivo}: ${error.message}`);
    }
  }

  return resultado;
}

async function main() {
  console.log('🧹 Script de Limpeza de Arquivos Temporários');
  console.log('='.repeat(60));
  console.log('\n⚠️  ATENÇÃO: Este script remove arquivos permanentemente!');
  console.log('   Revise a lista antes de executar.\n');

  const resultados = {
    alta: removerArquivos(arquivosAltaPrioridade, 'ALTA PRIORIDADE'),
    media: removerArquivos(arquivosMediaPrioridade, 'MÉDIA PRIORIDADE'),
    baixa: removerArquivos(arquivosBaixaPrioridade, 'BAIXA PRIORIDADE'),
  };

  // Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMO DA LIMPEZA');
  console.log(`${'='.repeat(60)}\n`);

  const totalRemovidos = 
    resultados.alta.removidos.length +
    resultados.media.removidos.length +
    resultados.baixa.removidos.length;

  const totalNaoEncontrados = 
    resultados.alta.naoEncontrados.length +
    resultados.media.naoEncontrados.length +
    resultados.baixa.naoEncontrados.length;

  const totalErros = 
    resultados.alta.erros.length +
    resultados.media.erros.length +
    resultados.baixa.erros.length;

  console.log(`✅ Arquivos removidos: ${totalRemovidos}`);
  console.log(`⚠️  Arquivos não encontrados: ${totalNaoEncontrados}`);
  console.log(`❌ Erros: ${totalErros}\n`);

  if (totalErros > 0) {
    console.log('📋 Erros encontrados:');
    [...resultados.alta.erros, ...resultados.media.erros, ...resultados.baixa.erros].forEach(
      ({ arquivo, erro }) => {
        console.log(`   - ${arquivo}: ${erro}`);
      }
    );
    console.log('');
  }

  console.log('🎉 Limpeza concluída!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Revise o arquivo ANALISE_ARQUIVOS_REMOVER.md');
  console.log('   2. Verifique se não há arquivos importantes removidos');
  console.log('   3. Considere fazer commit das mudanças\n');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
