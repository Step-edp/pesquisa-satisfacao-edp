const QUESTIONS_LAB = [
  'Cordialidade e qualidade do atendimento',
  'Esclarecimento de dúvidas',
  'Nível de conhecimento do profissional que lhe atendeu',
  'Instalações físicas do Laboratório',
  'Prazo de atendimento a sua solicitação',
  'Satisfação geral do atendimento no laboratório',
];

const QUESTIONS_EDP = [
  'Facilidade de comunicação nos canais de atendimento',
  'Cordialidade e qualidade no atendimento',
  'Prazo de atendimento a(s) sua(s) solicitação(ões)',
  'Qualidade e continuidade no fornecimento de energia',
  'Clareza de entendimento da fatura de energia',
  'Satisfação geral',
];

const BLOCKS = {
  lab: { badge: 'Bloco 1', title: 'Atendimento no Laboratório de Medição' },
  edp: { badge: 'Bloco 2', title: 'Atendimento da EDP no Geral' },
};

const FLOW_STEPS = [
  {
    type: 'text',
    field: 'nome',
    title: 'Nome e sobrenome',
    optional: true,
    intro: 'Opcional — preencha se desejar se identificar.',
    placeholder: 'Ex.: João Silva',
    inputType: 'text',
    autocomplete: 'name',
  },
  {
    type: 'text',
    field: 'telefone',
    title: 'Telefone',
    optional: true,
    intro: 'Opcional — informe se desejar ser contatado(a).',
    placeholder: 'Ex.: (12) 99999-9999',
    inputType: 'tel',
    autocomplete: 'tel',
  },
  ...QUESTIONS_LAB.map((text, i) => ({
    type: 'rating',
    field: `q${i + 1}`,
    number: i + 1,
    text,
    block: 'lab',
    showBlockHeader: i === 0,
  })),
  ...QUESTIONS_EDP.map((text, i) => ({
    type: 'rating',
    field: `q${QUESTIONS_LAB.length + i + 1}`,
    number: QUESTIONS_LAB.length + i + 1,
    text,
    block: 'edp',
    showBlockHeader: i === 0,
  })),
  {
    type: 'comment',
    field: 'comentario',
    title: 'Outros comentários e sugestões',
    intro: 'Opcional — espaço aberto para comentários adicionais.',
    placeholder: 'Escreva aqui seus comentários ou sugestões...',
  },
];

const answers = {};
let currentStep = -1;

function showStep(stepId) {
  document.querySelectorAll('.step').forEach((el) => el.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function updateProgress() {
  const wrap = document.getElementById('progress-wrap');
  const total = FLOW_STEPS.length;
  const current = currentStep + 1;
  const pct = Math.round((current / total) * 100);

  wrap.classList.remove('hidden');
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-label').textContent = `Etapa ${current} de ${total}`;
}

function hideProgress() {
  document.getElementById('progress-wrap').classList.add('hidden');
}

function renderBlockHeader(step) {
  const header = document.getElementById('flow-block-header');
  if (!step.showBlockHeader) {
    header.classList.add('hidden');
    header.innerHTML = '';
    return;
  }

  const block = BLOCKS[step.block];
  header.classList.remove('hidden');
  header.innerHTML = `
    <span class="block-badge">${block.badge}</span>
    <h2>${block.title}</h2>
  `;
}

function goNext(delay = 0) {
  const next = () => {
    if (currentStep < FLOW_STEPS.length - 1) {
      currentStep += 1;
      renderCurrentStep();
    } else {
      handleSubmit(buildPayload(), 'step-success');
    }
  };

  if (delay > 0) {
    setTimeout(next, delay);
  } else {
    next();
  }
}

function goBack() {
  if (currentStep > 0) {
    currentStep -= 1;
    renderCurrentStep();
  } else {
    currentStep = -1;
    hideProgress();
    showStep('step-consent');
  }
}

function renderRatingStep(step) {
  const selected = answers[step.field];

  return `
    <div class="question single" data-question-id="${step.field}">
      <p class="question-counter">Pergunta ${step.number} de ${QUESTIONS_LAB.length + QUESTIONS_EDP.length}</p>
      <p class="question-label">${step.text}</p>
      <div class="rating-scale">
        <div class="scale-labels">
          <span>0 — Muito insatisfeito</span>
          <span>5 — Muito satisfeito</span>
        </div>
        <div class="scale-buttons scale-buttons-lg">
          ${[0, 1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" class="scale-btn${selected === n ? ' selected' : ''}" data-value="${n}" aria-label="Nota ${n}">${n}</button>`
            )
            .join('')}
        </div>
        <p class="tap-hint">Toque em uma nota para continuar</p>
      </div>
    </div>
  `;
}

function renderTextStep(step) {
  const value = answers[step.field] ?? '';
  return `
    <h2>${step.title} <span class="optional">(opcional)</span></h2>
    <p class="intro">${step.intro}</p>
    <div class="form-group">
      <input
        type="${step.inputType}"
        id="input-${step.field}"
        value="${value}"
        placeholder="${step.placeholder}"
        autocomplete="${step.autocomplete}"
      >
    </div>
  `;
}

function renderCommentStep(step) {
  const value = answers[step.field] ?? '';
  return `
    <h2>${step.title}</h2>
    <p class="intro">${step.intro}</p>
    <div class="form-group">
      <textarea id="input-${step.field}" rows="5" placeholder="${step.placeholder}">${value}</textarea>
    </div>
  `;
}

function bindRatingEvents(step) {
  document.querySelectorAll('.scale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scale-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[step.field] = Number(btn.dataset.value);
      goNext(350);
    });
  });
}

function bindTextEvents(step) {
  const input = document.getElementById(`input-${step.field}`);
  input.addEventListener('input', () => {
    answers[step.field] = input.value;
  });
  input.focus();
}

function renderCurrentStep() {
  const step = FLOW_STEPS[currentStep];
  const content = document.getElementById('flow-content');
  const btnContinue = document.getElementById('btn-continue');
  const btnBack = document.getElementById('btn-back');

  showStep('step-flow');
  updateProgress();
  renderBlockHeader(step);

  if (step.type === 'rating') {
    content.innerHTML = renderRatingStep(step);
    btnContinue.classList.add('hidden');
    btnBack.textContent = 'Voltar';
    bindRatingEvents(step);
  } else if (step.type === 'text') {
    content.innerHTML = renderTextStep(step);
    btnContinue.classList.remove('hidden');
    btnContinue.textContent = 'Continuar';
    btnBack.textContent = 'Voltar';
    bindTextEvents(step);
  } else if (step.type === 'comment') {
    content.innerHTML = renderCommentStep(step);
    btnContinue.classList.remove('hidden');
    btnContinue.textContent = 'Enviar pesquisa';
    btnBack.textContent = 'Voltar';
    bindTextEvents(step);
  }
}

function buildPayload(options = {}) {
  const payload = {
    created_at: formatTimestamp(new Date()),
    nome: (answers.nome || '').trim() || 'Anônimo',
    telefone: (answers.telefone || '').trim() || 'Não Informado',
    comentario: (answers.comentario || '').trim() || '',
    nao_responder: options.naoResponder ? '1' : '',
  };

  const total = QUESTIONS_LAB.length + QUESTIONS_EDP.length;
  for (let i = 1; i <= total; i++) {
    payload[`questao${i}`] = options.naoResponder ? '' : (answers[`q${i}`] ?? '');
  }

  return payload;
}

async function submitData(payload) {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result) => {
          if (result && result.success) resolve(result);
          else reject(new Error(result?.error || 'Erro ao salvar na planilha.'));
        })
        .withFailureHandler((err) => reject(new Error(err.message || String(err))))
        .submitSurvey(payload);
    });
  }

  const url = typeof SUBMIT_URL !== 'undefined' ? SUBMIT_URL : SCRIPT_URL;

  if (!url && (!SCRIPT_URL || SCRIPT_URL === '')) {
    throw new Error(
      'Conexão com a planilha não configurada.\n\n' +
        '1. Abra a planilha → Extensões → Apps Script\n' +
        '2. Cole o código de google-apps-script/Code.gs\n' +
        '3. Implantar → App da Web → Qualquer pessoa\n' +
        '4. Cole a URL /exec em config.js (SCRIPT_URL)\n\n' +
        'Veja CONFIGURACAO.txt para detalhes.'
    );
  }

  const response = await fetch(url || '/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao enviar dados. Tente novamente.');
  }
}

function setLoading(visible) {
  document.getElementById('loading').classList.toggle('hidden', !visible);
}

async function handleSubmit(payload, successStepId) {
  setLoading(true);
  try {
    await submitData(payload);
    hideProgress();
    showStep(successStepId);
  } catch (err) {
    alert('Não foi possível enviar sua resposta. Tente novamente em alguns instantes.');
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-yes').addEventListener('click', () => {
    currentStep = 0;
    renderCurrentStep();
  });

  document.getElementById('btn-no').addEventListener('click', () => {
    handleSubmit(buildPayload({ naoResponder: true }), 'step-declined');
  });

  document.getElementById('btn-back').addEventListener('click', goBack);

  document.getElementById('btn-continue').addEventListener('click', () => {
    const step = FLOW_STEPS[currentStep];
    if (step.type === 'comment') {
      handleSubmit(buildPayload(), 'step-success');
    } else {
      goNext();
    }
  });
});
