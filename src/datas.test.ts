// Rodar com: npm test
import assert from 'node:assert/strict'
import { mesesRestantes, tempoRestante } from './datas.ts'

const hoje = new Date(2026, 9, 18)
assert.equal(mesesRestantes('2026-12-31', hoje), 2)
assert.equal(mesesRestantes('2026-10-17', hoje), -1)
assert.equal(tempoRestante('2030-12-31', hoje), '4 anos e 2 meses')
assert.equal(tempoRestante('2027-10-18', hoje), '1 ano')
assert.equal(tempoRestante('2026-11-10', hoje), 'menos de 1 mês')
assert.equal(tempoRestante('2026-10-17', hoje), 'encerrado')

console.log('datas ok')
