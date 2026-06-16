/**
 * Google Apps Script — Pesquisa de Satisfação EDP
 * Planilha: https://docs.google.com/spreadsheets/d/10w3JN3JqSQYCQ5bHN79RPzs7-2wBHmpOwQqfL9tR7Bc/edit
 *
 * COMO PUBLICAR (2 minutos):
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Cole este código e salve
 * 3. Implantar → Nova implantação → App da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 4. Copie a URL (termina em /exec) e cole em config.js → SCRIPT_URL
 */

const SPREADSHEET_ID = '10w3JN3JqSQYCQ5bHN79RPzs7-2wBHmpOwQqfL9tR7Bc';

function submitSurvey(data) {
  try {
    if (!data) {
      return autorizar();
    }
    return saveToSheet_(data);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function autorizar() {
  return saveToSheet_({
    created_at: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm:ss'),
    nome: 'Autorizacao',
    telefone: 'Nao Informado',
    comentario: 'Primeira execucao - autorizacao',
    nao_responder: '1',
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return jsonResponse_(saveToSheet_(data));
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pesquisa de Satisfação — EDP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveToSheet_(data) {
  if (!data) {
    throw new Error('Nenhum dado recebido.');
  }
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

  sheet.appendRow([
    data.created_at || '',
    data.nome || 'Anônimo',
    data.telefone || 'Não Informado',
    data.questao1 ?? '',
    data.questao2 ?? '',
    data.questao3 ?? '',
    data.questao4 ?? '',
    data.questao5 ?? '',
    data.questao6 ?? '',
    data.questao7 ?? '',
    data.questao8 ?? '',
    data.questao9 ?? '',
    data.questao10 ?? '',
    data.questao11 ?? '',
    data.questao12 ?? '',
    data.comentario || '',
    data.nao_responder || '',
  ]);

  return { success: true };
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
