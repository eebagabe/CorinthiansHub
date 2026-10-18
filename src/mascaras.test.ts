// Rodar com: npm test
import assert from 'node:assert/strict'
import { dataParaIso, isoParaData, mascararData, mascararMoeda, moedaParaNumero } from './mascaras.ts'

const semEspacoEspecial = (s: string) => s.replace(/\s/g, ' ')

assert.equal(semEspacoEspecial(mascararMoeda('375000', 'BRL')), 'R$ 375.000')
assert.equal(semEspacoEspecial(mascararMoeda('€ 11.000.0001', 'EUR')), '€ 110.000.001')
assert.equal(mascararMoeda('abc', 'BRL'), '')
assert.equal(semEspacoEspecial(mascararMoeda('000', 'BRL')), 'R$ 0')
assert.equal(moedaParaNumero('R$ 375.000'), 375000)
assert.equal(moedaParaNumero(''), null)

assert.equal(mascararData('31121999'), '31/12/1999')
assert.equal(mascararData('3112'), '31/12')
assert.equal(mascararData('31/12/19999'), '31/12/1999')
assert.equal(isoParaData('2028-12-31'), '31/12/2028')
assert.equal(dataParaIso('31/12/2028'), '2028-12-31')
assert.equal(dataParaIso(''), null)
assert.equal(dataParaIso('31/02/2028'), undefined)
assert.equal(dataParaIso('29/02/2028'), '2028-02-29')
assert.equal(dataParaIso('12/2028'), undefined)

console.log('mascaras ok')
