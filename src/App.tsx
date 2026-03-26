import { useReducer, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MenuItem from './components/MenuItem'
import OrderContents from './components/OrderContents'
import { initialState, orderReducer } from './reducers/order-reducer'
import OrderConfirmation from './pages/OrderConfirmation'
import AdminApp from './admin/AdminApp'
import type { MenuItemType } from './types/MenuItem'
import { translations } from './i18n/index'
import { getMenuData } from './api/menu'


// Category type from API
type CategoryFromAPI = {
  id: number
  key: string
  name_th: string
  name_en: string
  sort_order: number
}

// Menu item from API
type MenuItemFromAPI = {
  id: number
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  price: number
  image: string
}

const LANGS = [
  { code: 'th-TH', flag: 'https://flagcdn.com/th.svg', label: 'ไทย' },
  { code: 'en-US', flag: 'https://flagcdn.com/us.svg', label: 'English' },
] as const

type LangCode = typeof LANGS[number]['code']

// Templates
const TEMPLATES = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    icon: '🌊',
    colors: {
      primary: 'from-blue-600 to-cyan-500',
      primaryHover: 'from-blue-700 to-cyan-600',
      bg: 'from-blue-50 via-cyan-50 to-blue-50',
      border: 'border-blue-200',
      borderHover: 'border-blue-300',
      text: 'text-blue-600',
      ring: 'ring-blue-300'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    icon: '🌅',
    colors: {
      primary: 'from-orange-600 to-pink-500',
      primaryHover: 'from-orange-700 to-pink-600',
      bg: 'from-orange-50 via-pink-50 to-orange-50',
      border: 'border-orange-200',
      borderHover: 'border-orange-300',
      text: 'text-orange-600',
      ring: 'ring-orange-300'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    icon: '👑',
    colors: {
      primary: 'from-purple-600 to-indigo-600',
      primaryHover: 'from-purple-700 to-indigo-700',
      bg: 'from-purple-50 via-indigo-50 to-purple-50',
      border: 'border-purple-200',
      borderHover: 'border-purple-300',
      text: 'text-purple-600',
      ring: 'ring-purple-300'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    icon: '🌲',
    colors: {
      primary: 'from-emerald-600 to-teal-600',
      primaryHover: 'from-emerald-700 to-teal-700',
      bg: 'from-emerald-50 via-teal-50 to-emerald-50',
      border: 'border-emerald-200',
      borderHover: 'border-emerald-300',
      text: 'text-emerald-600',
      ring: 'ring-emerald-300'
    }
  },
  {
    id: 'modern',
    name: 'Modern Lime',
    icon: '🌟',
    colors: {
      primary: 'from-lime-600 to-yellow-500',
      primaryHover: 'from-lime-700 to-yellow-600',
      bg: 'from-lime-50 via-yellow-50 to-lime-50',
      border: 'border-lime-200',
      borderHover: 'border-lime-300',
      text: 'text-lime-600',
      ring: 'ring-lime-300'
    }
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    icon: '🌹',
    colors: {
      primary: 'from-rose-500 to-pink-500',
      primaryHover: 'from-rose-600 to-pink-600',
      bg: 'from-rose-50 via-pink-50 to-rose-50',
      border: 'border-rose-200',
      borderHover: 'border-rose-300',
      text: 'text-rose-600',
      ring: 'ring-rose-300'
    }
  }
] as const

type TemplateId = typeof TEMPLATES[number]['id']
const DEFAULT_TEMPLATE: TemplateId = 'ocean'

function App() {
  const [state, dispatch] = useReducer(orderReducer, initialState)
  const [activeCategory, setActiveCategory] = useState('')
  const [lang, setLang] = useState<LangCode>('th-TH')
  const [showLangs, setShowLangs] = useState(false)
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE)
  const [showTemplates, setShowTemplates] = useState(false)

  // API state
  const [categories, setCategories] = useState<CategoryFromAPI[]>([])
  const [menuData, setMenuData] = useState<Record<string, MenuItemFromAPI[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = translations[lang]
  const currentTemplate = TEMPLATES.find(tmpl => tmpl.id === template) || TEMPLATES[0]

  // Fetch menu data from API
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true)
        const data = await getMenuData()
        setCategories(data.categories || [])
        setMenuData(data.menu || {})
        // Set first category as active
        if (data.categories && data.categories.length > 0) {
          setActiveCategory(data.categories[0].key)
        }
        setError(null)
      } catch (err: any) {
        console.error('Failed to load menu:', err)
        setError('ไม่สามารถโหลดเมนูได้ กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์')
      } finally {
        setLoading(false)
      }
    }
    loadMenu()
  }, [])

  // Map API menu items to the format components expect
  const currentMenu: MenuItemType[] = (menuData[activeCategory] || []).map((item: MenuItemFromAPI) => ({
    id: item.id,
    name: lang === 'th-TH' ? item.name_th : item.name_en,
    description: lang === 'th-TH' ? item.description_th : item.description_en,
    price: item.price,
    image: item.image,
    // Keep originals for order API
    name_th: item.name_th,
    name_en: item.name_en,
  }))

  const getLogoFilter = () => {
    switch (template) {
      case 'ocean': return 'hue-rotate(200deg) saturate(1.2)'
      case 'sunset': return 'hue-rotate(25deg) saturate(1.1)'
      case 'purple': return 'hue-rotate(270deg) saturate(1.3)'
      case 'emerald': return 'hue-rotate(150deg) saturate(1.1)'
      case 'rose': return 'hue-rotate(320deg) saturate(1.2)'
      default: return 'none'
    }
  }

  useEffect(() => {
    const handleClickOutside = () => {
      setShowLangs(false)
      setShowTemplates(false)
    }
    if (showLangs || showTemplates) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showLangs, showTemplates])

  return (
    <Router>
      <div className={`min-h-screen bg-gradient-to-br ${currentTemplate.colors.bg} font-sans flex flex-col py-8 px-4 sm:px-6 lg:px-8`}>
        {/* Nav */}
        <nav className={`w-full mb-8 flex flex-wrap items-center justify-between text-base sm:text-lg font-medium bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border ${currentTemplate.colors.border} relative z-40`}>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/" className={`flex items-center gap-2 transition-colors text-gray-800 hover:${currentTemplate.colors.text}`}>
              <img src="/images/logo.svg" alt="POS plus Logo" className="h-12 w-auto drop-shadow-md transition-all duration-300" style={{ filter: getLogoFilter() }} />
              <span className={`text-xl font-black tracking-tight bg-gradient-to-r ${currentTemplate.colors.primary} bg-clip-text text-transparent`}>POS +</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4 ml-4">
              <Link to="/" className={`flex items-center gap-1 transition-colors text-gray-600 hover:${currentTemplate.colors.text}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${currentTemplate.colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                {t.home}
              </Link>
            </div>
          </div>

          {/* Template + Language selectors */}
          <div className="flex items-center gap-3">
            {/* Template selector */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className={`flex items-center border-2 ${currentTemplate.colors.border} rounded-lg px-3 py-2 bg-gradient-to-r ${currentTemplate.colors.primary} text-white font-semibold gap-2 hover:${currentTemplate.colors.primaryHover} transition-all duration-300 shadow-md`}
                onClick={() => setShowTemplates(v => !v)}
              >
                <span className="text-lg">{currentTemplate.icon}</span>
                {currentTemplate.name}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTemplates && (
                <div className={`absolute right-0 mt-2 bg-white border-2 ${currentTemplate.colors.border} rounded-lg shadow-xl z-[60] min-w-[160px] backdrop-blur-sm`}>
                  {TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      className={`flex items-center w-full px-4 py-2 gap-2 rounded-lg border border-transparent font-semibold transition-colors
                        ${template === tmpl.id
                          ? `bg-gradient-to-r ${tmpl.colors.primary} text-white`
                          : `bg-white ${tmpl.colors.text} hover:bg-opacity-10 hover:${tmpl.colors.text}`}
                      `}
                      onClick={() => { setTemplate(tmpl.id); setShowTemplates(false) }}
                    >
                      <span className="text-lg">{tmpl.icon}</span>
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language selector */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className={`flex items-center border-2 ${currentTemplate.colors.border} rounded-lg px-3 py-2 bg-gradient-to-r ${currentTemplate.colors.primary} text-white font-semibold gap-2 hover:${currentTemplate.colors.primaryHover} transition-all duration-300 shadow-md`}
                onClick={() => setShowLangs(v => !v)}
              >
                <img src={LANGS.find(l => l.code === lang)?.flag} alt="" className="w-5 h-5 rounded-full object-cover" style={{ background: "#fff" }} />
                {LANGS.find(l => l.code === lang)?.label}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLangs && (
                <div className={`absolute right-0 mt-2 bg-white border-2 ${currentTemplate.colors.border} rounded-lg shadow-xl z-[60] min-w-[140px] backdrop-blur-sm`}>
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      className={`flex items-center w-full px-4 py-2 gap-2 rounded-lg border border-transparent font-semibold transition-colors
                        ${lang === l.code
                          ? `bg-gradient-to-r ${currentTemplate.colors.primary} text-white`
                          : `bg-white ${currentTemplate.colors.text} hover:bg-opacity-10`}
                      `}
                      onClick={() => { setLang(l.code); setShowLangs(false) }}
                    >
                      <img src={l.flag} alt={l.label} className="w-5 h-5 rounded-full object-cover" style={{ background: "#fff" }} />
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <main className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 relative z-10">
                <section className={`w-full p-4 sm:p-6 lg:p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border ${currentTemplate.colors.border} flex flex-col justify-between lg:col-span-1 xl:col-span-1 2xl:col-span-1`}>
                  {state.order.length ? (
                    <OrderContents order={state.order} dispatch={dispatch} t={t} tip={state.tip} discount={state.discount} template={currentTemplate} />
                  ) : (
                    <div className="flex flex-1 items-center justify-center h-full">
                      <p className="text-center text-gray-500 text-lg">{t.emptyOrder}</p>
                    </div>
                  )}
                </section>

                <section className={`w-full p-4 sm:p-6 lg:p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border ${currentTemplate.colors.border} lg:col-span-2 xl:col-span-2 2xl:col-span-3`}>
                  <h2 className={`text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r ${currentTemplate.colors.primary} bg-clip-text text-transparent`}>
                    {t.menu}
                  </h2>

                  {/* Loading / Error states */}
                  {loading && (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-500">กำลังโหลดเมนู...</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
                      <p className="font-semibold">⚠️ {error}</p>
                      <p className="text-sm mt-1">กรุณาตรวจสอบว่า Backend server กำลังทำงานอยู่ที่ http://localhost:3001</p>
                    </div>
                  )}

                  {!loading && !error && (
                    <>
                      {/* Category tabs */}
                      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-lime-300 scrollbar-track-transparent">
                        {categories.map(cat => (
                          <button
                            key={cat.key}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-300
                              ${activeCategory === cat.key
                                ? `bg-gradient-to-r ${currentTemplate.colors.primary} text-white ${currentTemplate.colors.border} shadow-lg`
                                : `bg-white ${currentTemplate.colors.text} ${currentTemplate.colors.border} hover:bg-opacity-10 hover:shadow-md`}
                            `}
                            onClick={() => setActiveCategory(cat.key)}
                          >
                            {lang === 'th-TH' ? cat.name_th : cat.name_en}
                          </button>
                        ))}
                      </div>

                      {/* Menu items grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                        {currentMenu.map((item: MenuItemType) => (
                          <MenuItem key={item.id} item={item} dispatch={dispatch} template={currentTemplate} />
                        ))}
                      </div>

                      {currentMenu.length === 0 && (
                        <p className="text-center text-gray-400 py-10">ยังไม่มีเมนูในหมวดนี้</p>
                      )}
                    </>
                  )}
                </section>
              </main>
            }
          />
          <Route path="/confirmacion" element={<OrderConfirmation t={t} />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>

        {/* Footer */}
        <footer className="w-full mt-8 flex flex-col items-center">
          <div className={`flex items-center gap-3 text-lg text-gray-600 font-medium bg-white/60 backdrop-blur-sm rounded-xl px-6 py-3 border ${currentTemplate.colors.border}`}>
            <span className={`text-xl font-black tracking-tight bg-gradient-to-r ${currentTemplate.colors.primary} bg-clip-text text-transparent`}>POS +</span>
            <span className="hidden sm:inline">|</span>
            <span className="text-lg text-gray-600">
              © {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
