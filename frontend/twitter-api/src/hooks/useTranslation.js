import { useLanguage } from '../contexts/LanguageContext'
import tr from '../locales/tr.json'
import en from '../locales/en.json'

const translations = {
  tr,
  en
}

export const useTranslation = () => {
  const { language } = useLanguage()

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return value
  }

  return { t, language }
}
