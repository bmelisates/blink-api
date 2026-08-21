import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// Dil bilgisini bileşenler arasında prop olarak taşımadan paylaşmak için bir Context oluşturuyoruz.
const LanguageContext = createContext()

// Bu dosyada hem Context Provider'ı hem de Context'i kullanacak özel hook'u dışa aktarıyoruz.
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  // En yakındaki LanguageContext.Provider tarafından paylaşılan değeri okuyoruz.
  const context = useContext(LanguageContext)

  // Provider bulunamazsa geliştiriciye kullanım hatasını açıkça bildiriyoruz.
  if (!context) {
    throw new Error('useLanguage, LanguageProvider içinde kullanılmalıdır')
  }

  // Aktif dili ve changeLanguage fonksiyonunu hook'u çağıran bileşene veriyoruz.
  return context
}

// children, LanguageProvider etiketi arasına yerleştirilen tüm uygulama bileşenlerini temsil eder.
export const LanguageProvider = ({ children }) => {
  // Aktif dili React state'i içinde saklıyoruz.
  // Sayfa daha önce ziyaret edilmişse localStorage'daki seçim okunur; seçim yoksa Türkçe kullanılır.
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr'
  })

  // Kullanıcı yeni bir dil seçtiğinde çalışan fonksiyonu oluşturuyoruz.
  // useCallback, dil değişmediği sürece aynı fonksiyon referansını korur.
  const changeLanguage = useCallback((lang) => {
    // State'i güncellemek, Context'i kullanan bileşenlerin yeniden render edilmesini sağlar.
    setLanguage(lang)

    // Seçimi tarayıcıya kaydederek sayfa yenilendiğinde de aynı dilin kullanılmasını sağlıyoruz.
    localStorage.setItem('language', lang)
  }, [])

  // Provider üzerinden paylaşılacak değerleri tek bir nesnede topluyoruz.
  // useMemo, language veya changeLanguage değişmedikçe bu nesnenin yeniden oluşturulmasını önler.
  const value = useMemo(() => ({ language, changeLanguage }), [language, changeLanguage])

  // value içindeki language ve changeLanguage, provider altındaki tüm bileşenlere açılır.
  return (
    <LanguageContext.Provider value={value}>
      {/* Uygulamanın LanguageProvider ile sarılmış olan alt bileşenlerini ekrana basıyoruz. */}
      {children}
    </LanguageContext.Provider>
  )
}
