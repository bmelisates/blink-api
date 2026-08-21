import { useLanguage } from '../contexts/LanguageContext'
import tr from '../locales/tr.json'
import en from '../locales/en.json'

// Desteklenen dilleri ilgili çeviri dosyalarıyla eşleştiriyoruz.
const translations = {
  tr,
  en
}

export const useTranslation = () => {
  // Context üzerinden kullanıcının seçtiği aktif dili alıyoruz.
  const { language } = useLanguage()

  // "profile.followers" gibi noktalı bir anahtarı çeviri dosyasında arıyoruz.
  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]

    // Anahtarın her bölümünde ilerleyerek iç içe çeviri değerine ulaşıyoruz.
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k]
      } else {
        // Çeviri bulunamazsa eksik anahtarın fark edilebilmesi için anahtarı geri döndürüyoruz.
        return key
      }
    }

    return value
  }

  return { t, language }
}
