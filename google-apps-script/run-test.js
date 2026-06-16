const { spawnSync } = require('child_process');
const path = require('path');

const params = JSON.stringify([{
  created_at: '2026-06-16 16:25:00',
  nome: 'Autorizacao',
  telefone: 'Nao Informado',
  comentario: 'Primeira execucao',
  nao_responder: '1',
}]);

const result = spawnSync(
  'clasp',
  ['run', 'submitSurvey', '--params', params],
  { cwd: path.join(__dirname), encoding: 'utf8', shell: true }
);

console.log('stdout:', result.stdout);
console.log('stderr:', result.stderr);
console.log('status:', result.status);
