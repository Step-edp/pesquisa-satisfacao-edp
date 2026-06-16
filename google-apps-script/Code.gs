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
  return saveToSheet_(data);
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
  return jsonResponse_({
    status: 'ok',
    message: 'Pesquisa de Satisfação EDP — endpoint ativo',
    spreadsheetId: SPREADSHEET_ID,
  });
}

function saveToSheet_(data) {
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
