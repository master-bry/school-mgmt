import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { loadLocale } from '../i18n'

export function useTranslation() {
  const { user } = useAuth()
  const locale = user?.school?.locale || 'en'

  const translations = useMemo(() => loadLocale(locale), [locale])

  function t(key, fallback) {
    return translations[key] ?? fallback ?? key
  }

  return { t, locale }
}
