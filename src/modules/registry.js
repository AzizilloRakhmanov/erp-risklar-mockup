/*
 * Modullar ro'yxati. Har bir modul `src/modules/<nom>/` papkasida yashaydi
 * va bu yerga bitta yozuv bilan qo'shiladi:
 *
 *   { id: 'risk-reyestri', nom: 'Risklar reyestri', izoh: '...' }
 */
import risklar from './risklar/module.js';

export const MODULLAR = [risklar];
