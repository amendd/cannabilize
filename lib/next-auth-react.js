'use client';
/**
 * Re-export de next-auth/react para contornar "Module not found" no build.
 * O caminho relativo evita problemas de resolução do campo "exports" do pacote.
 */
// eslint-disable-next-line no-restricted-syntax
module.exports = require('../node_modules/next-auth/react/index.js');
