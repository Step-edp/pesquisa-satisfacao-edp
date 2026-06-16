const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3456;
const SPREADSHEET_ID = '10w3JN3JqSQYCQ5bHN79RPzs7-2wBHmpOwQqfL9tR7Bc';
const ROOT = __dirname;

const app = express();
app.use(express.json({ limit: '1mb' }));

function readScriptUrl() {
  const localPath = path.join(ROOT, 'config.local.json');
  if (fs.existsSync(localPath)) {
    try {
      const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      if (local.scriptUrl) return local.scriptUrl;
    } catch (_) {
      /* ignore */
    }
  }

  const configPath = path.join(ROOT, 'config.js');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/const SCRIPT_URL\s*=\s*[\s\S]*?'([^']+)'/);
    if (match && match[1] && !match[1].includes('COLE')) {
      return match[1];
    }
  }

  return process.env.SCRIPT_URL || '';
}

function buildRow(data) {
  return [
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
  ];
}

async function appendViaAppsScript(scriptUrl, data) {
  const body = JSON.stringify(data);
  let url = scriptUrl;
  let response;

  for (let i = 0; i < 5; i++) {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) break;
      url = location;
      continue;
    }
    break;
  }

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*"success"[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Resposta inválida do Google Apps Script.');
    }
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao salvar na planilha.');
  }

  return result;
}

async function appendViaGoogleApi(data) {
  const credPath = path.join(ROOT, 'credentials.json');
  if (!fs.existsSync(credPath)) {
    return null;
  }

  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'A:Q',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [buildRow(data)] },
  });

  return { success: true };
}

app.get('/', (req, res) => {
  const scriptUrl = readScriptUrl();
  if (scriptUrl && !req.query.stay) {
    return res.redirect(302, scriptUrl);
  }
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use(express.static(ROOT, { index: false }));

app.post('/api/submit', async (req, res) => {
  try {
    const scriptUrl = readScriptUrl();

    if (scriptUrl) {
      const result = await appendViaAppsScript(scriptUrl, req.body);
      return res.json(result);
    }

    const apiResult = await appendViaGoogleApi(req.body);
    if (apiResult) {
      return res.json(apiResult);
    }

    return res.status(503).json({
      success: false,
      error:
        'Conexão com a planilha não configurada. Configure as credenciais Google no Railway ou publique o Apps Script.',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  const scriptUrl = readScriptUrl();
  console.log(`Pesquisa EDP: http://localhost:${PORT}`);
  console.log(`Planilha: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
  if (scriptUrl) {
    console.log('Apps Script: configurado');
  } else {
    console.log('Apps Script: NÃO configurado — veja CONFIGURACAO.txt');
  }
});
