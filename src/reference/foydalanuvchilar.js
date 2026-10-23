/*
 * Mockup foydalanuvchilari — manual risk muallifi, mas'ul va tarix yozuvlari
 * uchun. Joriy foydalanuvchi qobiqning yuqori panelida tanlanadi.
 */
export const FOYDALANUVCHILAR = [
  { id: 'u1', nom: 'Каримов Азиз', lavozim: 'Ички аудитор' },
  { id: 'u2', nom: 'Тошматова Нилуфар', lavozim: 'Бош аудитор' },
  { id: 'u3', nom: 'Раҳимов Шерзод', lavozim: 'Молия назоратчиси' },
  { id: 'u4', nom: 'Юсупова Дилноза', lavozim: 'Харидлар назоратчиси' }
];

/** Avtomatik amallar muallifi */
export const TIZIM = { id: 'tizim', nom: 'Тизим (автоматик)', lavozim: 'Автоматик' };

export const foydalanuvchiTop = (id) => FOYDALANUVCHILAR.find((u) => u.id === id) ?? (id === 'tizim' ? TIZIM : null);
