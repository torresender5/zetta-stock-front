export const LEGAL_VERSION = '1.0'

export const LEGAL_UPDATED_AT = '7 de octubre de 2026'

export const OPERADOR = {
  nombre: 'ZettaStock',
  marca: 'ZettaStock',
  razonSocial: '[RAZÓN SOCIAL A COMPLETAR]',
  rif: '[RIF A COMPLETAR]',
  domicilio: '[DOMICILIO FISCAL A COMPLETAR]',
  emailSoporte: 'soporte@zettastock.com',
  emailPrivacidad: 'privacidad@zettastock.com',
  sitioWeb: 'https://zettastock.com',
}

export const MIN_EDAD = 18

export type LegalDoc = {
  path: string
  title: string
}

export const LEGAL_DOCS: LegalDoc[] = [
  { path: '/terminos', title: 'Términos y Condiciones' },
  { path: '/privacidad', title: 'Política de Privacidad' },
  { path: '/reembolsos', title: 'Política de Reembolsos' },
  { path: '/cookies', title: 'Política de Cookies' },
  { path: '/aviso-legal', title: 'Aviso Legal' },
]

export const URL_TERMINOS = `${window.location.origin}/terminos`
export const URL_PRIVACIDAD = `${window.location.origin}/privacidad`
export const URL_REEMBOLSOS = `${window.location.origin}/reembolsos`
