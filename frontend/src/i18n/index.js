import en from './en.json'
import sw from './sw.json'

const locales = { en, sw }

export function loadLocale(locale) {
  return locales[locale] || locales.en
}

export default locales
