import { useState, useMemo, useEffect, useRef } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = 'landing' | 'input' | 'habits' | 'results' | 'future' | 'whatif' | 'destinations'
type Gender = 'male' | 'female' | null
type ColorTheme = 'colorful' | 'dark'
type ChartType = 'pie' | 'bar'

interface UserData {
  age: number
  gender: Gender
  sleepHours: number
  phoneHours: number
  workHours: number
  commuteHours: number
  leisureHours: number
  exerciseHours: number
  mealsHours: number
  houseworkHours: number
  entertainmentHours: number
}

interface HabitsData {
  smokingCigsPerDay: number
  cigPackPrice: number
  alcoholDrinksPerWeek: number
  alcoholDrinkPrice: number
  coffeePerDay: number
  coffeePrice: number
  junkFoodPerWeek: number
  junkFoodPrice: number
}

// ─── Theme System ─────────────────────────────────────────────────────────────

interface Theme {
  bg: string; bgCard: string; bgMuted: string; bgAccentLight: string
  text: string; textSub: string; textMuted: string
  accent: string; accentContrast: string; border: string
  chartColors: string[]
}

const THEMES: Record<ColorTheme, Theme> = {
  colorful: {
    bg: '#FAFAF8', bgCard: '#F2F1EE', bgMuted: '#E5E3DF', bgAccentLight: '#EDE9FE',
    text: '#0D0D0B', textSub: '#78756E', textMuted: '#9CA3AF',
    accent: '#6D28D9', accentContrast: '#FAFAF8', border: '#E5E3DF',
    chartColors: ['#6D28D9','#DB2777','#0284C7','#D97706','#059669','#DC2626','#0891B2','#65A30D','#7C3AED','#9CA3AF'],
  },
  dark: {
    bg: '#0C0C14', bgCard: '#161622', bgMuted: '#1E1E2E', bgAccentLight: '#2D1B69',
    text: '#EEEEF5', textSub: '#8888AA', textMuted: '#505068',
    accent: '#8B5CF6', accentContrast: '#FAFAF8', border: '#252535',
    chartColors: ['#8B5CF6','#F472B6','#38BDF8','#FBBF24','#34D399','#F87171','#06B6D4','#84CC16','#A78BFA','#94A3B8'],
  },
}

const THEME_LABELS: Record<ColorTheme, string> = {
  colorful: '☀️ Светлый',
  dark: '🌙 Тёмный',
}

// ─── Animals ──────────────────────────────────────────────────────────────────

interface Animal { name: string; emoji: string; description: string; trait: string }

function getAnimal(data: UserData): Animal {
  const { sleepHours, workHours, phoneHours, leisureHours, exerciseHours } = data
  if (workHours >= 10) return {
    name: 'Пчела', emoji: '🐝', trait: 'Трудоголик',
    description: 'Ты настоящий трудоголик! Пчела никогда не останавливается — постоянно строит, создаёт и производит. Твоя энергия заражает всех вокруг.',
  }
  if (sleepHours >= 9.5) return {
    name: 'Ленивец', emoji: '🦥', trait: 'Любитель сна',
    description: 'Ты ценишь сон превыше всего. Ленивец — символ неторопливой мудрости: именно во сне происходит самое важное восстановление мозга и тела.',
  }
  if (sleepHours <= 5.5) return {
    name: 'Сова', emoji: '🦉', trait: 'Ночной житель',
    description: 'Ты жертвуешь сном ради активной жизни. Совы видят то, что другие не замечают — но помни: хронический недосып снижает IQ на 10–15 пунктов.',
  }
  if (phoneHours >= 6) return {
    name: 'Сорока', emoji: '🐦‍⬛', trait: 'Цифровой коллектор',
    description: 'Ты всегда в курсе всего. Сорока коллекционирует блестящее — так же и ты собираешь информацию в телефоне. Может, пора перебирать коллекцию?',
  }
  if (exerciseHours >= 1.5) return {
    name: 'Гепард', emoji: '🐆', trait: 'Спортсмен',
    description: 'Ты активен и энергичен! Гепард — самое быстрое существо планеты. Твоя физическая активность — это инвестиция, которая окупается долголетием.',
  }
  if (leisureHours >= 4 && sleepHours >= 7) return {
    name: 'Кошка', emoji: '🐱', trait: 'Мастер отдыха',
    description: 'Ты умеешь наслаждаться жизнью. Кошки спят 14 часов и всё равно успевают сделать всё что нужно — баланс отдыха и дела это настоящая суперсила.',
  }
  if (sleepHours >= 7.5 && sleepHours <= 8.5 && workHours >= 6 && workHours <= 9) return {
    name: 'Лев', emoji: '🦁', trait: 'Гармоничная личность',
    description: 'Ты живёшь сбалансированно — работаешь, отдыхаешь и высыпаешься. Лев — царь зверей, который всегда знает: когда охотиться, а когда лежать под солнцем.',
  }
  return {
    name: 'Дельфин', emoji: '🐬', trait: 'Универсальная личность',
    description: 'Ты многогранен и адаптивен. Дельфины — самые интеллектуальные существа океана, умеющие приспособиться к любой ситуации и всегда находящие выход.',
  }
}

// ─── Sleep Science ────────────────────────────────────────────────────────────

const SLEEP_PHASES = [
  {
    name: 'Лёгкий сон', pct: 45, color: '#A78BFA',
    desc: 'Переход в сон. Мышцы расслабляются, температура тела падает. Легко проснуться. Подготовка к глубокому сну.',
  },
  {
    name: 'Глубокий сон', pct: 25, color: '#6D28D9',
    desc: 'Самый восстановительный этап. Иммунитет, клеточное восстановление, синтез гормона роста, долгосрочная память.',
  },
  {
    name: 'REM-сон', pct: 25, color: '#DB2777',
    desc: 'Сновидения, обработка эмоций, консолидация памяти. Мозг почти так же активен, как при бодрствовании.',
  },
  {
    name: 'Пробуждения', pct: 5, color: '#D97706',
    desc: 'Кратковременные пробуждения — абсолютная норма. Здоровый человек просыпается 4–6 раз за ночь, не помня об этом.',
  },
]

function getSleepRec(age: number): { min: number; max: number } {
  if (age < 18) return { min: 8, max: 10 }
  if (age < 26) return { min: 7, max: 9 }
  if (age < 65) return { min: 7, max: 9 }
  return { min: 7, max: 8 }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_RATIO = 5 / 7

const ACTIVITY_META = {
  sleeping:      { label: 'Сон',         emoji: '😴' },
  phone:         { label: 'Телефон',     emoji: '📱' },
  work:          { label: 'Работа',      emoji: '💼' },
  commute:       { label: 'Дорога',      emoji: '🚌' },
  leisure:       { label: 'Отдых',       emoji: '🌿' },
  exercise:      { label: 'Спорт',       emoji: '🏃' },
  meals:         { label: 'Еда',         emoji: '🍽️' },
  housework:     { label: 'Быт',         emoji: '🏠' },
  entertainment: { label: 'Развлечения', emoji: '🎮' },
  other:         { label: 'Остальное',   emoji: '✦'  },
}

const DESTINATION_IDEAS = [
  { icon: '✈️', title: 'Путешествия',  desc: 'Объехать все континенты мира',      hours: 8760 },
  { icon: '📚', title: 'Новый язык',   desc: 'Уровень B2 за 600 часов занятий',    hours: 600  },
  { icon: '🎸', title: 'Музыка',       desc: 'Научиться играть на гитаре',          hours: 1000 },
  { icon: '🏃', title: 'Марафон',      desc: 'Пробежать свой первый марафон',        hours: 300  },
  { icon: '👨‍👩‍👧', title: 'Семья',        desc: 'Присутствовать в жизни близких',      hours: 5000 },
  { icon: '🎨', title: 'Творчество',   desc: 'Написать книгу или снять фильм',       hours: 2000 },
]

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DATA: UserData = {
  age: 22, gender: null,
  sleepHours: 7, phoneHours: 4, workHours: 8, commuteHours: 1.5,
  leisureHours: 2, exerciseHours: 0.5, mealsHours: 1.5, houseworkHours: 1, entertainmentHours: 1.5,
}

const DEFAULT_HABITS: HabitsData = {
  smokingCigsPerDay: 0, cigPackPrice: 200,
  alcoholDrinksPerWeek: 2, alcoholDrinkPrice: 350,
  coffeePerDay: 2, coffeePrice: 150,
  junkFoodPerWeek: 2, junkFoodPrice: 500,
}

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcStats(data: UserData, years: number) {
  const days = years * 365.25
  const total = days * 24
  const sleeping      = days * data.sleepHours
  const phone         = days * data.phoneHours
  const work          = days * WEEKDAY_RATIO * data.workHours
  const commute       = days * WEEKDAY_RATIO * data.commuteHours
  const leisure       = days * data.leisureHours
  const exercise      = days * data.exerciseHours
  const meals         = days * data.mealsHours
  const housework     = days * data.houseworkHours
  const entertainment = days * data.entertainmentHours
  const other = Math.max(0, total - sleeping - phone - work - commute - leisure - exercise - meals - housework - entertainment)
  return { total, sleeping, phone, work, commute, leisure, exercise, meals, housework, entertainment, other }
}

function calcHabits(h: HabitsData, years: number) {
  const days = years * 365.25
  const weeks = years * 52.18
  const smokingCigs   = h.smokingCigsPerDay * days
  const smokingCost   = (smokingCigs / 20) * h.cigPackPrice
  const smokingHours  = (smokingCigs * 5) / 60
  const alcoholDrinks = h.alcoholDrinksPerWeek * weeks
  const alcoholCost   = alcoholDrinks * h.alcoholDrinkPrice
  const alcoholHours  = (alcoholDrinks * 30) / 60
  const coffee        = h.coffeePerDay * days
  const coffeeCost    = coffee * h.coffeePrice
  const coffeeHours   = (coffee * 15) / 60
  const junkFood      = h.junkFoodPerWeek * weeks
  const junkFoodCost  = junkFood * h.junkFoodPrice
  const totalCost     = smokingCost + alcoholCost + coffeeCost + junkFoodCost
  const totalHours    = smokingHours + alcoholHours + coffeeHours
  return { smokingCigs, smokingCost, smokingHours, alcoholDrinks, alcoholCost, alcoholHours, coffee, coffeeCost, coffeeHours, junkFood, junkFoodCost, totalCost, totalHours }
}

function fmt(h: number) { return Math.round(h).toLocaleString('ru-RU') }
function pluralize(value: number, one: string, few: string, many: string) {
  const abs = Math.abs(Math.round(value))
  const lastTwo = abs % 100
  const last = abs % 10
  if (lastTwo >= 11 && lastTwo <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}
function formatYearsCount(years: number) {
  const rounded = Math.round(years * 10) / 10
  const value = rounded.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  const unit = Number.isInteger(rounded)
    ? pluralize(rounded, 'год', 'года', 'лет')
    : 'года'
  return `${value} ${unit}`
}
function hoursToYears(h: number) {
  const y = h / 8760
  if (y >= 1) return formatYearsCount(y)
  const m = h / 730
  if (m >= 1) {
    const months = Math.round(m)
    return `${months} ${pluralize(months, 'месяц', 'месяца', 'месяцев')}`
  }
  const days = Math.round(h / 24)
  return `${days} ${pluralize(days, 'день', 'дня', 'дней')}`
}
function fmtMoney(n: number) { return Math.round(n).toLocaleString('ru-RU') + ' ₽' }
function formatCommuteTime(value: number) {
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const duration = [
    hours > 0 ? `${hours} ч` : '',
    minutes > 0 ? `${minutes} мин` : '',
  ].filter(Boolean).join(' ') || '0 мин'
  return duration
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startVal = useRef(0)
  const startTime = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    startVal.current = display
    startTime.current = null
    const animate = (ts: number) => {
      if (startTime.current === null) startTime.current = ts
      const progress = Math.min((ts - startTime.current) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.round(startVal.current + (value - startVal.current) * ease))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])
  return <span>{display.toLocaleString('ru-RU')}</span>
}

// ─── SliderField ──────────────────────────────────────────────────────────────

function SliderField({ label, emoji, value, min, max, step, onChange, t, unit = 'ч/день', hint, formatValue }: {
  label: string; emoji?: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; t: Theme; unit?: string; hint?: string
  formatValue?: (value: number) => string
}) {
  const progress = ((value - min) / (max - min)) * 100
  const displayValue = (current: number) => formatValue
    ? formatValue(current)
    : `${current.toLocaleString('ru-RU')} ${unit}`
  const changeBy = (delta: number) => {
    const precision = (step.toString().split('.')[1] ?? '').length
    const next = Math.min(max, Math.max(min, value + delta))
    onChange(Number(next.toFixed(precision)))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-medium min-w-0" style={{ color: t.text }}>
          {emoji && <span>{emoji}</span>}{label}
        </span>
        <span className="font-mono-data text-sm font-semibold text-right flex-shrink-0" style={{ color: t.accent }}>
          {displayValue(value)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Уменьшить: ${label}`} disabled={value <= min}
          onClick={() => changeBy(-step)}
          className="slider-step-button"
          style={{ background: t.bgCard, borderColor: t.border, color: t.text }}>
          −
        </button>
        <input type="range" min={min} max={max} step={step} value={value}
          aria-label={label}
          style={{ background: `linear-gradient(to right, ${t.accent} 0%, ${t.accent} ${progress}%, ${t.bgMuted} ${progress}%, ${t.bgMuted} 100%)` }}
          onChange={e => onChange(Number(e.target.value))} />
        <button type="button" aria-label={`Увеличить: ${label}`} disabled={value >= max}
          onClick={() => changeBy(step)}
          className="slider-step-button"
          style={{ background: t.bgCard, borderColor: t.border, color: t.text }}>
          +
        </button>
      </div>
      <div className="flex justify-between text-xs" style={{ color: t.textMuted }}>
        <span>{displayValue(min)}</span>
        {hint && <span className="italic">{hint}</span>}
        <span>{displayValue(max)}</span>
      </div>
    </div>
  )
}

// ─── StatBar ──────────────────────────────────────────────────────────────────

function StatBar({ label, hours, total, color, emoji, t }: {
  label: string; hours: number; total: number; color: string; emoji: string; t: Theme
}) {
  const pct = Math.min(100, (hours / total) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span style={{ color: t.text }}>{label}</span>
        </span>
        <span className="font-mono-data text-xs" style={{ color: t.textSub }}>
          {fmt(hours)} ч · {hoursToYears(hours)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.bgMuted }}>
        <div className="h-full rounded-full bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ onBack, onReset, label, t }: { onBack?: () => void; onReset?: () => void; label?: string; t: Theme }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-2 text-sm hover:opacity-60 transition-opacity"
          style={{ color: t.textSub }}>
          ← {label ?? 'Назад'}
        </button>
      ) : <div />}
      {onReset && (
        <button onClick={onReset}
          className="text-xs px-3 py-1.5 rounded-full border transition-colors"
          style={{ borderColor: t.accent, color: t.accent }}>
          Изменить данные
        </button>
      )}
    </div>
  )
}

// ─── PageWrap ─────────────────────────────────────────────────────────────────

function PageWrap({ children, t }: { children: React.ReactNode; t: Theme }) {
  return (
    <div className="page-enter min-h-screen px-5 py-8 max-w-2xl mx-auto w-full" style={{ color: t.text }}>
      {children}
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, t }: { active?: boolean; payload?: any[]; t: Theme }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="px-3 py-2 rounded-lg text-sm shadow-lg" style={{ background: t.text, color: t.bg }}>
      <div className="font-medium">{name}</div>
      <div className="font-mono-data">{fmt(value)} ч — {hoursToYears(value)}</div>
    </div>
  )
}

// ─── Theme Switcher ───────────────────────────────────────────────────────────

function ThemeSwitcher({ theme, setTheme, t }: { theme: ColorTheme; setTheme: (th: ColorTheme) => void; t: Theme }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full p-1" style={{ background: t.bgCard, border: `1px solid ${t.border}` }}>
      {(Object.keys(THEME_LABELS) as ColorTheme[]).map(th => (
        <button key={th} onClick={() => setTheme(th)}
          className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
          style={{
            background: theme === th ? t.accent : 'transparent',
            color: theme === th ? t.accentContrast : t.textSub,
          }}>
          {THEME_LABELS[th]}
        </button>
      ))}
    </div>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage({ onStart, theme, setTheme, t }: {
  onStart: () => void; theme: ColorTheme; setTheme: (th: ColorTheme) => void; t: Theme
}) {
  const [sleepExpanded, setSleepExpanded] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: t.bg }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto w-full">
        <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: t.bgAccentLight, color: t.accent }}>
          ⏱ Интерактивный калькулятор
        </span>
        <ThemeSwitcher theme={theme} setTheme={setTheme} t={t} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-16 max-w-2xl mx-auto w-full text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black leading-none mb-6" style={{ color: t.text }}>
          Твоя жизнь<br />
          <span style={{ color: t.accent }}>в цифрах</span>
        </h1>
        <p className="text-lg mb-4 max-w-md mx-auto" style={{ color: t.textSub, lineHeight: 1.6 }}>
          Введи данные о своём дне — и узнай, сколько часов уже потрачено на сон, телефон, работу и дорогу.
          И что ждёт тебя через 10 лет, если ничего не изменится.
        </p>
        <p className="text-sm mb-10" style={{ color: t.textMuted }}>
          Без регистрации · Всё считается в браузере
        </p>

        <button onClick={onStart}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl mb-8"
          style={{ background: t.accent, color: t.accentContrast }}>
          Посчитать мою жизнь
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>

        {/* Sleep science toggle */}
        <button onClick={() => setSleepExpanded(!sleepExpanded)}
          className="text-sm mb-8 transition-opacity hover:opacity-70 flex items-center gap-2"
          style={{ color: t.textSub }}>
          <span>{sleepExpanded ? '▲' : '▼'}</span>
          {sleepExpanded ? 'Скрыть информацию о сне' : '🧠 Факты о сне и его влиянии на жизнь'}
        </button>

        {sleepExpanded && (
          <div className="w-full text-left mb-10 space-y-4 page-enter">
            <h2 className="font-display text-2xl font-black" style={{ color: t.text }}>Наука о сне</h2>

            {/* Sleep phases */}
            <div className="rounded-2xl p-5" style={{ background: t.bgCard }}>
              <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: t.textMuted }}>
                ФАЗЫ ОДНОГО ЦИКЛА (≈ 90 МИН)
              </div>
              <div className="space-y-4">
                {SLEEP_PHASES.map(phase => (
                  <div key={phase.name} className="flex gap-3">
                    <div className="flex-shrink-0 w-1 rounded-full" style={{ background: phase.color, minHeight: 44 }} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm" style={{ color: t.text }}>{phase.name}</span>
                        <span className="font-mono-data text-xs px-1.5 py-0.5 rounded" style={{ background: t.bgMuted, color: t.textSub }}>
                          ~{phase.pct}%
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>{phase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration effects */}
            <div className="rounded-2xl p-5" style={{ background: t.bgCard }}>
              <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: t.textMuted }}>
                КАК ДЛИТЕЛЬНОСТЬ ВЛИЯЕТ НА ЗДОРОВЬЕ
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '< 6 ч', icon: '⚠️', col: '#DC2626', effects: ['Снижение иммунитета', 'Проблемы с памятью', 'Риск диабета', 'Перепады настроения'] },
                  { label: '7–9 ч', icon: '✅', col: '#059669', effects: ['Оптимальное восстановление', 'Лучшая концентрация', 'Здоровый метаболизм', 'Эмоциональный баланс'] },
                  { label: '> 10 ч', icon: '🔄', col: '#D97706', effects: ['Вялость и апатия', 'Нарушение ритмов', 'Возможна депрессия', 'Снижение активности'] },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: t.bgMuted }}>
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="font-mono-data font-bold text-sm mb-2" style={{ color: item.col }}>{item.label}</div>
                    <ul className="space-y-1 text-left">
                      {item.effects.map(e => (
                        <li key={e} className="text-xs leading-tight" style={{ color: t.textSub }}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Facts */}
            <div className="rounded-2xl p-5" style={{ background: t.bgAccentLight }}>
              <div className="text-xs font-semibold tracking-widest mb-3" style={{ color: t.accent }}>
                ИНТЕРЕСНЫЕ ФАКТЫ
              </div>
              <ul className="space-y-2.5">
                {[
                  ['🧠', 'Мозг «промывается» от токсинов только во сне — это главная функция ночного отдыха'],
                  ['😴', 'За 70 лет жизни человек спит ~229 000 часов = 26 лет'],
                  ['🌙', 'Полный цикл сна — 90 минут, за ночь проходит 4–6 циклов'],
                  ['⚡', 'Депривация сна снижает когнитивные функции так же, как алкогольное опьянение'],
                  ['🐬', 'Дельфины и птицы спят, используя только половину мозга — поочерёдно'],
                  ['👶', 'Новорождённые проводят в REM-сне до 50% времени сна (взрослые — 25%)'],
                ].map(([icon, text]) => (
                  <li key={text as string} className="flex gap-2 text-xs leading-relaxed">
                    <span className="flex-shrink-0">{icon}</span>
                    <span style={{ color: t.textSub }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gender sleep differences */}
            <div className="rounded-2xl p-5" style={{ background: t.bgCard }}>
              <div className="text-xs font-semibold tracking-widest mb-3" style={{ color: t.textMuted }}>
                МУЖЧИНЫ И ЖЕНЩИНЫ: РАЗНИЦА В СНЕ
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { g: '♂️', label: 'Мужчины', facts: ['Более глубокий сон в молодости', 'Чаще страдают апноэ', 'Меньше фаз REM в среднем возрасте', 'Труднее переносят ночные смены'] },
                  { g: '♀️', label: 'Женщины', facts: ['Больше времени в REM-сне', 'Чаще страдают бессонницей', 'Гормоны влияют на качество сна', 'Более чувствительны к шуму ночью'] },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span>{item.g}</span>
                      <span className="font-semibold text-sm" style={{ color: t.text }}>{item.label}</span>
                    </div>
                    <ul className="space-y-1">
                      {item.facts.map(f => (
                        <li key={f} className="text-xs flex gap-1.5 leading-tight" style={{ color: t.textSub }}>
                          <span style={{ color: t.accent }}>·</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom stats */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-lg pb-16">
          {[
            { n: '87 600', label: 'часов в 10 годах' },
            { n: '10+', label: 'активностей' },
            { n: '∞', label: 'способов изменить жизнь' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl font-black" style={{ color: t.text }}>{item.n}</span>
              <span className="text-xs text-center" style={{ color: t.textSub }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── INPUT PAGE ───────────────────────────────────────────────────────────────

function InputPage({ initial, onSubmit, onBack, t }: {
  initial: UserData; onSubmit: (d: UserData) => void; onBack: () => void; t: Theme
}) {
  const [data, setData] = useState<UserData>(initial)
  const set = (key: keyof UserData) => (v: number) => setData(prev => ({ ...prev, [key]: v }))

  const dailyAvg = data.sleepHours + data.phoneHours + data.leisureHours + data.exerciseHours
    + data.mealsHours + data.houseworkHours + data.entertainmentHours
    + (data.workHours + data.commuteHours) * WEEKDAY_RATIO
  const overload = dailyAvg > 24

  const rec = getSleepRec(data.age)
  const sleepStatus = data.sleepHours < rec.min ? 'мало' : data.sleepHours > rec.max ? 'много' : 'норма'
  const sleepMessage = data.sleepHours === 0
    ? 'Ноль часов сна — смело. Даже совы сейчас немного волнуются.'
    : `Для твоего возраста рекомендуется ${rec.min}–${rec.max} ч. Сейчас: ${sleepStatus}`

  const Divider = () => <div className="h-px" style={{ background: t.border }} />

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} label="На главную" t={t} />
      <h2 className="font-display text-4xl font-black mb-2" style={{ color: t.text }}>Расскажи о себе</h2>
      <p className="mb-8 text-sm" style={{ color: t.textSub }}>Двигай ползунки — округлённые значения это нормально</p>

      <div className="flex flex-col gap-7">

        {/* Age */}
        <SliderField label="Возраст" emoji="🎂" value={data.age} min={10} max={100} step={1}
          onChange={set('age')} t={t} unit="лет" />

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium flex items-center gap-2" style={{ color: t.text }}>
            <span>👤</span> Пол
          </span>
          <div className="flex gap-3">
            {([['male', '♂️ Мужской'], ['female', '♀️ Женский']] as [Gender, string][]).map(([g, label]) => (
              <button key={g!}
                onClick={() => setData(prev => ({ ...prev, gender: g }))}
                className="flex-1 py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: data.gender === g ? t.accent : t.bgCard,
                  color: data.gender === g ? t.accentContrast : t.textSub,
                  border: `1.5px solid ${data.gender === g ? t.accent : t.border}`,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Divider />
        <div className="text-xs font-semibold tracking-widest" style={{ color: t.textMuted }}>ОСНОВНЫЕ АКТИВНОСТИ</div>

        {/* Sleep + hint */}
        <div className="flex flex-col gap-2">
          <SliderField label="Сон" emoji="😴" value={data.sleepHours}
            min={0} max={12} step={0.5} onChange={set('sleepHours')} t={t} hint={`норма ${rec.min}–${rec.max} ч`} />
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: t.bgCard }}>
            <span>{data.sleepHours === 0 ? '🦉' : sleepStatus === 'норма' ? '✅' : '⚠️'}</span>
            <span style={{ color: sleepStatus === 'норма' ? '#059669' : '#D97706' }}>
              {sleepMessage}
            </span>
          </div>
        </div>

        <SliderField label="Телефон / соцсети" emoji="📱" value={data.phoneHours}
          min={0} max={12} step={0.5} onChange={set('phoneHours')} t={t} hint="средний 4 ч" />
        <SliderField label="Работа / учёба" emoji="💼" value={data.workHours}
          min={0} max={14} step={0.5} onChange={set('workHours')} t={t} unit="ч за будний день" hint="5 дней из 7" />
        <SliderField label="Дорога туда и обратно в один будний день" emoji="🚌" value={data.commuteHours}
          min={0} max={6} step={0.25} onChange={set('commuteHours')} t={t}
          hint="весь путь за день" formatValue={formatCommuteTime} />

        <Divider />
        <div className="text-xs font-semibold tracking-widest" style={{ color: t.textMuted }}>ОСТАЛЬНЫЕ АКТИВНОСТИ</div>

        <SliderField label="Спорт / тренировки" emoji="🏃" value={data.exerciseHours}
          min={0} max={4} step={0.25} onChange={set('exerciseHours')} t={t} hint="норма 0.5–1.5 ч" />
        <SliderField label="Приём пищи" emoji="🍽️" value={data.mealsHours}
          min={0.5} max={4} step={0.25} onChange={set('mealsHours')} t={t} hint="среднее 1.5 ч" />
        <SliderField label="Домашние дела / быт" emoji="🏠" value={data.houseworkHours}
          min={0} max={4} step={0.25} onChange={set('houseworkHours')} t={t} hint="среднее 1 ч" />
        <SliderField label="Отдых / хобби" emoji="🌿" value={data.leisureHours}
          min={0} max={8} step={0.5} onChange={set('leisureHours')} t={t} />
        <SliderField label="ТВ / игры / стриминг" emoji="🎮" value={data.entertainmentHours}
          min={0} max={6} step={0.5} onChange={set('entertainmentHours')} t={t} hint="среднее 2 ч" />
      </div>

      {overload && (
        <div className="mt-6 text-sm px-4 py-3 rounded-xl flex gap-2 items-start"
          style={{ background: '#FEF3C7', color: '#92400E' }}>
          <span>⚠️</span>
          <span>Сумма активностей превышает 24 ч — часть войдёт в «остальное».</span>
        </div>
      )}

      <div className="mt-10">
        <button onClick={() => onSubmit(data)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: t.accent, color: t.accentContrast }}>
          Далее: вредные привычки →
        </button>
      </div>
    </PageWrap>
  )
}

// ─── HABITS PAGE ──────────────────────────────────────────────────────────────

function HabitsPage({ initial, onSubmit, onBack, t }: {
  initial: HabitsData; onSubmit: (h: HabitsData) => void; onBack: () => void; t: Theme
}) {
  const [habits, setHabits] = useState<HabitsData>(initial)
  const set = (key: keyof HabitsData) => (v: number) => setHabits(prev => ({ ...prev, [key]: v }))
  const prev10 = useMemo(() => calcHabits(habits, 10), [habits])

  function HabitCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
    return (
      <div className="rounded-2xl p-5" style={{ background: t.bgCard }}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">{emoji}</span>
          <span className="font-display font-bold text-lg" style={{ color: t.text }}>{title}</span>
        </div>
        {children}
      </div>
    )
  }

  function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
      <div>
        <div className="font-mono-data text-sm font-semibold" style={{ color: color ?? t.text }}>{value}</div>
        <div className="text-xs" style={{ color: t.textSub }}>{label}</div>
      </div>
    )
  }

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} label="Назад" t={t} />

      <div className="mb-8">
        <h2 className="font-display text-4xl font-black mb-2" style={{ color: t.text }}>Вредные привычки</h2>
        <p className="text-sm" style={{ color: t.textSub }}>Считаем время и деньги честно</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Smoking */}
        <HabitCard emoji="🚬" title="Курение">
          <SliderField label="Сигарет в день" value={habits.smokingCigsPerDay}
            min={0} max={40} step={1} onChange={set('smokingCigsPerDay')} t={t} unit="шт" hint="0 = не курю" />
          {habits.smokingCigsPerDay > 0 && <>
            <div className="mt-4">
              <SliderField label="Цена пачки (20 сигарет)" value={habits.cigPackPrice}
                min={100} max={700} step={10} onChange={set('cigPackPrice')} t={t} unit="₽" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: t.bgMuted }}>
              <MiniStat label="сигарет за 10 лет" value={Math.round(prev10.smokingCigs).toLocaleString('ru-RU')} />
              <MiniStat label="часов на курение" value={fmt(prev10.smokingHours) + ' ч'} />
              <MiniStat label="потрачено денег" value={fmtMoney(prev10.smokingCost)} color="#DC2626" />
            </div>
          </>}
        </HabitCard>

        {/* Alcohol */}
        <HabitCard emoji="🍺" title="Алкоголь">
          <SliderField label="Алкогольных напитков в неделю" value={habits.alcoholDrinksPerWeek}
            min={0} max={21} step={1} onChange={set('alcoholDrinksPerWeek')} t={t} unit="напитков" hint="0 = не пью" />
          {habits.alcoholDrinksPerWeek > 0 && <>
            <div className="mt-4">
              <SliderField label="Стоимость одного напитка" value={habits.alcoholDrinkPrice}
                min={100} max={2000} step={50} onChange={set('alcoholDrinkPrice')} t={t} unit="₽" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: t.bgMuted }}>
              <MiniStat label="напитков за 10 лет" value={Math.round(prev10.alcoholDrinks).toLocaleString('ru-RU')} />
              <MiniStat label="часов за столом" value={fmt(prev10.alcoholHours) + ' ч'} />
              <MiniStat label="потрачено денег" value={fmtMoney(prev10.alcoholCost)} color="#DC2626" />
            </div>
          </>}
        </HabitCard>

        {/* Coffee */}
        <HabitCard emoji="☕" title="Кофе">
          <SliderField label="Чашек в день" value={habits.coffeePerDay}
            min={0} max={10} step={1} onChange={set('coffeePerDay')} t={t} unit="чашек" />
          {habits.coffeePerDay > 0 && <>
            <div className="mt-4">
              <SliderField label="Стоимость чашки" value={habits.coffeePrice}
                min={30} max={700} step={10} onChange={set('coffeePrice')} t={t} unit="₽" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: t.bgMuted }}>
              <MiniStat label="чашек за 10 лет" value={Math.round(prev10.coffee).toLocaleString('ru-RU')} />
              <MiniStat label="часов на кофе" value={fmt(prev10.coffeeHours) + ' ч'} />
              <MiniStat label="потрачено денег" value={fmtMoney(prev10.coffeeCost)} color="#D97706" />
            </div>
          </>}
        </HabitCard>

        {/* Junk food */}
        <HabitCard emoji="🍔" title="Фастфуд / перекусы">
          <SliderField label="Раз в неделю" value={habits.junkFoodPerWeek}
            min={0} max={14} step={1} onChange={set('junkFoodPerWeek')} t={t} unit="раз" hint="0 = не ем" />
          {habits.junkFoodPerWeek > 0 && <>
            <div className="mt-4">
              <SliderField label="Средний чек" value={habits.junkFoodPrice}
                min={100} max={2000} step={50} onChange={set('junkFoodPrice')} t={t} unit="₽" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 p-4 rounded-xl" style={{ background: t.bgMuted }}>
              <MiniStat label="раз за 10 лет" value={Math.round(prev10.junkFood).toLocaleString('ru-RU')} />
              <MiniStat label="потрачено денег" value={fmtMoney(prev10.junkFoodCost)} color="#DC2626" />
            </div>
          </>}
        </HabitCard>

        {/* Grand total */}
        {prev10.totalCost > 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: t.bgAccentLight, border: `1.5px solid ${t.accent}` }}>
            <div className="text-sm mb-1" style={{ color: t.accent }}>Итого за 10 лет на вредные привычки</div>
            <div className="font-display text-5xl font-black mb-2" style={{ color: t.text }}>
              {fmtMoney(prev10.totalCost)}
            </div>
            {prev10.totalHours > 0 && (
              <div className="text-sm mb-3" style={{ color: t.textSub }}>
                + {fmt(prev10.totalHours)} часов времени ({hoursToYears(prev10.totalHours)})
              </div>
            )}
            <div className="text-xs px-4 py-2 rounded-xl inline-block" style={{ background: t.bgCard, color: t.textSub }}>
              На эти деньги:{' '}
              {prev10.totalCost > 1500000 ? '🌍 можно объехать весь мир' :
               prev10.totalCost > 700000  ? '✈️ слетать в Европу 10+ раз' :
               prev10.totalCost > 300000  ? '🎓 оплатить курс или обучение' :
               prev10.totalCost > 100000  ? '📱 купить несколько телефонов' :
               '🍕 съесть 200 пицц'}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <button onClick={() => onSubmit(habits)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
          style={{ background: t.accent, color: t.accentContrast }}>
          Показать мои цифры →
        </button>
      </div>
    </PageWrap>
  )
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────

function ResultsPage({ data, habits, onNext, onBack, onReset, t }: {
  data: UserData; habits: HabitsData; onNext: () => void; onBack: () => void; onReset: () => void; t: Theme
}) {
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [copied, setCopied] = useState(false)

  const stats  = useMemo(() => calcStats(data, data.age), [data])
  const animal = useMemo(() => getAnimal(data), [data])

  const chartData = [
    { name: ACTIVITY_META.sleeping.label,      value: stats.sleeping,      color: t.chartColors[0] },
    { name: ACTIVITY_META.phone.label,         value: stats.phone,         color: t.chartColors[1] },
    { name: ACTIVITY_META.work.label,          value: stats.work,          color: t.chartColors[2] },
    { name: ACTIVITY_META.commute.label,       value: stats.commute,       color: t.chartColors[3] },
    { name: ACTIVITY_META.leisure.label,       value: stats.leisure,       color: t.chartColors[4] },
    { name: ACTIVITY_META.exercise.label,      value: stats.exercise,      color: t.chartColors[5] },
    { name: ACTIVITY_META.meals.label,         value: stats.meals,         color: t.chartColors[6] },
    { name: ACTIVITY_META.housework.label,     value: stats.housework,     color: t.chartColors[7] },
    { name: ACTIVITY_META.entertainment.label, value: stats.entertainment, color: t.chartColors[8] },
    { name: ACTIVITY_META.other.label,         value: stats.other,         color: t.chartColors[9] },
  ].filter(d => d.value > 0)

  const TooltipEl = ({ active, payload }: any) => (
    <ChartTooltip active={active} payload={payload} t={t} />
  )

  const handleSave = () => {
    const text = [
      'МОЯ ЖИЗНЬ В ЦИФРАХ',
      '━'.repeat(28),
      `Возраст: ${data.age} лет | Пол: ${data.gender === 'male' ? 'Мужской' : data.gender === 'female' ? 'Женский' : 'Не указан'}`,
      '',
      `Итого прожито: ${fmt(stats.total)} ч = ${formatYearsCount(stats.total / 8760)} жизни`,
      '',
      'Разбивка:',
      `  Сон:         ${fmt(stats.sleeping)} ч (${hoursToYears(stats.sleeping)})`,
      `  Телефон:     ${fmt(stats.phone)} ч (${hoursToYears(stats.phone)})`,
      `  Работа:      ${fmt(stats.work)} ч (${hoursToYears(stats.work)})`,
      `  Дорога:      ${fmt(stats.commute)} ч (${hoursToYears(stats.commute)})`,
      `  Отдых:       ${fmt(stats.leisure)} ч`,
      `  Спорт:       ${fmt(stats.exercise)} ч`,
      `  Еда:         ${fmt(stats.meals)} ч`,
      `  Быт:         ${fmt(stats.housework)} ч`,
      `  Развлечения: ${fmt(stats.entertainment)} ч`,
      '',
      `Ты — ${animal.name} (${animal.trait})`,
      '',
      'Подсчитано на сайте «Твоя жизнь в цифрах»',
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} onReset={onReset} t={t} />

      {/* Big number */}
      <div className="mb-2 text-sm font-medium" style={{ color: t.textSub }}>Итого прожито</div>
      <div className="font-display font-black leading-none mb-1"
        style={{ fontSize: 'clamp(3rem, 10vw, 5.5rem)', color: t.text }}>
        <AnimatedNumber value={Math.round(stats.total)} duration={1400} />
      </div>
      <div className="text-lg mb-8 font-medium" style={{ color: t.accent }}>
        часов = {formatYearsCount(stats.total / 8760)} жизни
      </div>

      {/* Animal card */}
      <div className="rounded-2xl p-5 mb-8 flex items-center gap-4 transition-all"
        style={{ background: t.bgAccentLight, border: `1.5px solid ${t.accent}` }}>
        <div className="text-5xl flex-shrink-0 w-14 text-center">{animal.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: t.accent }}>
            ТЫ — {animal.trait.toUpperCase()}
          </div>
          <div className="font-display text-xl font-black" style={{ color: t.text }}>{animal.name}</div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: t.textSub }}>{animal.description}</p>
        </div>
      </div>

      {/* Chart type toggle */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium flex-shrink-0" style={{ color: t.textMuted }}>Вид:</span>
        <div className="flex gap-1">
          {(['pie', 'bar'] as ChartType[]).map(ct => (
            <button key={ct} onClick={() => setChartType(ct)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: chartType === ct ? t.accent : t.bgCard,
                color: chartType === ct ? t.accentContrast : t.textSub,
                border: `1px solid ${chartType === ct ? t.accent : t.border}`,
              }}>
              {ct === 'pie' ? '🍩 Кольцо' : '📊 Столбцы'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: t.bgCard, padding: '20px 20px 12px' }}>
        <ResponsiveContainer width="100%" height={250}>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={900}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<TooltipEl />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false}
                tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={v => [`${fmt(Number(v))} ч`, '']}
                contentStyle={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 11 }}
                cursor={{ fill: `${t.accent}18` }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={900}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
          {chartData.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="flex-1 truncate" style={{ color: t.textSub }}>{d.name}</span>
              <span className="font-mono-data flex-shrink-0" style={{ color: t.text }}>{fmt(d.value)} ч</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat bars */}
      <div className="flex flex-col gap-4 mb-8">
        <h3 className="font-display text-xl font-bold" style={{ color: t.text }}>Разбивка по активностям</h3>
        <StatBar label="Сон"         hours={stats.sleeping}      total={stats.total} color={t.chartColors[0]} emoji="😴" t={t} />
        <StatBar label="Телефон"     hours={stats.phone}         total={stats.total} color={t.chartColors[1]} emoji="📱" t={t} />
        <StatBar label="Работа"      hours={stats.work}          total={stats.total} color={t.chartColors[2]} emoji="💼" t={t} />
        <StatBar label="Дорога"      hours={stats.commute}       total={stats.total} color={t.chartColors[3]} emoji="🚌" t={t} />
        <StatBar label="Отдых"       hours={stats.leisure}       total={stats.total} color={t.chartColors[4]} emoji="🌿" t={t} />
        <StatBar label="Спорт"       hours={stats.exercise}      total={stats.total} color={t.chartColors[5]} emoji="🏃" t={t} />
        <StatBar label="Еда"         hours={stats.meals}         total={stats.total} color={t.chartColors[6]} emoji="🍽️" t={t} />
        <StatBar label="Быт"         hours={stats.housework}     total={stats.total} color={t.chartColors[7]} emoji="🏠" t={t} />
        <StatBar label="Развлечения" hours={stats.entertainment} total={stats.total} color={t.chartColors[8]} emoji="🎮" t={t} />
        {stats.other > 0 && <StatBar label="Остальное" hours={stats.other} total={stats.total} color={t.chartColors[9]} emoji="✦" t={t} />}
      </div>

      {/* Save button */}
      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium text-sm transition-all mb-4"
        style={{ background: t.bgCard, color: copied ? '#059669' : t.textSub, border: `1px solid ${t.border}` }}>
        {copied ? '✅ Скопировано в буфер обмена!' : '💾 Сохранить результаты (скопировать текст)'}
      </button>

      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold transition-all hover:opacity-90"
        style={{ background: t.accent, color: t.accentContrast }}>
        А что будет через 10 лет? →
      </button>
    </PageWrap>
  )
}

// ─── FUTURE PAGE ──────────────────────────────────────────────────────────────

function FuturePage({ data, habits, onNext, onBack, onReset, t }: {
  data: UserData; habits: HabitsData; onNext: () => void; onBack: () => void; onReset: () => void; t: Theme
}) {
  const stats    = useMemo(() => calcStats(data, 10), [data])
  const habStats = useMemo(() => calcHabits(habits, 10), [habits])
  const phoneDaysPerYear = Math.round(stats.phone / 10 / 24)

  const barData = [
    { name: 'Сон',     hours: Math.round(stats.sleeping),      fill: t.chartColors[0] },
    { name: 'Телефон', hours: Math.round(stats.phone),         fill: t.chartColors[1] },
    { name: 'Работа',  hours: Math.round(stats.work),          fill: t.chartColors[2] },
    { name: 'Дорога',  hours: Math.round(stats.commute),       fill: t.chartColors[3] },
    { name: 'Отдых',   hours: Math.round(stats.leisure),       fill: t.chartColors[4] },
    { name: 'Спорт',   hours: Math.round(stats.exercise),      fill: t.chartColors[5] },
    { name: 'Еда',     hours: Math.round(stats.meals),         fill: t.chartColors[6] },
  ].filter(d => d.hours > 0)

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} onReset={onReset} t={t} />
      <div className="mb-2 text-sm font-medium" style={{ color: t.textSub }}>Следующие 10 лет</div>
      <h2 className="font-display font-black mb-2" style={{ fontSize: 'clamp(2.5rem, 9vw, 4.5rem)', color: t.text }}>
        <AnimatedNumber value={Math.round(stats.total)} duration={1200} />
        <span className="text-2xl font-normal ml-2" style={{ color: t.textSub }}>часов впереди</span>
      </h2>
      <p className="mb-8 text-sm" style={{ color: t.textSub }}>
        Если текущие привычки не изменятся — вот как распределится твоё время.
      </p>

      {/* Highlights */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: '📱', label: 'За телефоном', hours: stats.phone },
          { icon: '😴', label: 'Во сне',       hours: stats.sleeping },
          { icon: '🚌', label: 'В дороге',     hours: stats.commute },
        ].map(h => (
          <div key={h.label} className="rounded-2xl p-4 flex flex-col gap-1 text-center" style={{ background: t.bgCard }}>
            <div className="text-2xl">{h.icon}</div>
            <div className="font-display text-xl font-black" style={{ color: t.text }}>{hoursToYears(h.hours)}</div>
            <div className="text-xs" style={{ color: t.textSub }}>{h.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard }}>
        <h3 className="font-display text-lg font-bold mb-4" style={{ color: t.text }}>Часов по активностям</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: t.textMuted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false}
              tickFormatter={v => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={v => [`${fmt(Number(v))} ч`, '']}
              contentStyle={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 11 }}
              cursor={{ fill: `${t.accent}18` }} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} animationDuration={900}>
              {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Habits 10-year summary */}
      {habStats.totalCost > 0 && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard }}>
          <h3 className="font-display text-lg font-bold mb-4" style={{ color: t.text }}>Вредные привычки за 10 лет</h3>
          <div className="grid grid-cols-2 gap-3">
            {habits.smokingCigsPerDay > 0 && (
              <div className="rounded-xl p-3" style={{ background: t.bgMuted }}>
                <div className="text-xl mb-1">🚬</div>
                <div className="font-mono-data font-bold text-sm" style={{ color: '#DC2626' }}>{fmtMoney(habStats.smokingCost)}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textSub }}>{fmt(habStats.smokingHours)} ч на курение</div>
              </div>
            )}
            {habits.alcoholDrinksPerWeek > 0 && (
              <div className="rounded-xl p-3" style={{ background: t.bgMuted }}>
                <div className="text-xl mb-1">🍺</div>
                <div className="font-mono-data font-bold text-sm" style={{ color: '#DC2626' }}>{fmtMoney(habStats.alcoholCost)}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textSub }}>{fmt(habStats.alcoholHours)} ч</div>
              </div>
            )}
            {habits.coffeePerDay > 0 && (
              <div className="rounded-xl p-3" style={{ background: t.bgMuted }}>
                <div className="text-xl mb-1">☕</div>
                <div className="font-mono-data font-bold text-sm" style={{ color: '#D97706' }}>{fmtMoney(habStats.coffeeCost)}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textSub }}>{fmt(habStats.coffeeHours)} ч на кофе</div>
              </div>
            )}
            {habits.junkFoodPerWeek > 0 && (
              <div className="rounded-xl p-3" style={{ background: t.bgMuted }}>
                <div className="text-xl mb-1">🍔</div>
                <div className="font-mono-data font-bold text-sm" style={{ color: '#DC2626' }}>{fmtMoney(habStats.junkFoodCost)}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textSub }}>фастфуд</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 flex justify-between text-sm" style={{ borderTop: `1px solid ${t.border}` }}>
            <span style={{ color: t.textSub }}>Итого на привычки:</span>
            <span className="font-mono-data font-bold" style={{ color: '#DC2626' }}>{fmtMoney(habStats.totalCost)}</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5 mb-8 border-l-4" style={{ background: t.bgAccentLight, borderColor: t.accent }}>
        <p className="text-sm font-medium" style={{ color: t.accent }}>
          {data.phoneHours === 0 ? (
            <>Ты указал, что не пользуешься телефоном и соцсетями — поэтому здесь 0 часов.</>
          ) : (
            <>
              При текущем режиме за 10 лет на телефон уйдёт{' '}
              <strong>{hoursToYears(stats.phone)}</strong>. Это примерно{' '}
              <strong>
                {phoneDaysPerYear} {pluralize(phoneDaysPerYear, 'день', 'дня', 'дней')} в год
              </strong>, если сложить всё это время подряд.
            </>
          )}
        </p>
      </div>

      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold transition-all hover:opacity-90"
        style={{ background: t.accent, color: t.accentContrast }}>
        А что, если изменить привычки? →
      </button>
    </PageWrap>
  )
}

// ─── WHATIF PAGE ──────────────────────────────────────────────────────────────

function WhatIfPage({ data, onNext, onBack, onReset, t }: {
  data: UserData; onNext: () => void; onBack: () => void; onReset: () => void; t: Theme
}) {
  const [mod, setMod] = useState<UserData>({ ...data })
  const setM = (key: keyof UserData) => (v: number) => setMod(prev => ({ ...prev, [key]: v }))

  const orig     = useMemo(() => calcStats(data, 10), [data])
  const adjusted = useMemo(() => calcStats(mod, 10), [mod])

  const savedPhone   = Math.max(0, orig.phone    - adjusted.phone)
  const savedWork    = Math.max(0, orig.work     - adjusted.work)
  const savedCommute = Math.max(0, orig.commute  - adjusted.commute)
  const savedSleep   = Math.max(0, orig.sleeping - adjusted.sleeping)
  const totalSaved   = savedPhone + savedWork + savedCommute + savedSleep

  function CompareRow({ label, origH, adjH, color, emoji }: {
    label: string; origH: number; adjH: number; color: string; emoji: string
  }) {
    const saved = Math.max(0, origH - adjH)
    return (
      <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0" style={{ borderColor: t.border }}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <span>{emoji}</span>
            <span style={{ color: t.text }}>{label}</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-mono-data" style={{ color: t.textSub }}>
            <span>{fmt(origH)} ч</span>
            <span>→</span>
            <span style={{ color: adjH < origH ? '#059669' : adjH > origH ? '#DC2626' : t.textSub }}>
              {fmt(adjH)} ч
            </span>
          </div>
        </div>
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: t.bgMuted }}>
          <div className="absolute h-full rounded-full" style={{ width: `${(origH / orig.total) * 100}%`, background: color, opacity: 0.2 }} />
          <div className="absolute h-full rounded-full transition-all duration-500" style={{ width: `${(adjH / orig.total) * 100}%`, background: color }} />
        </div>
        {saved > 0 && (
          <div className="text-xs" style={{ color: '#059669' }}>
            + {fmt(saved)} ч свободно ({hoursToYears(saved)})
          </div>
        )}
      </div>
    )
  }

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} onReset={onReset} t={t} />
      <h2 className="font-display text-4xl font-black mb-2" style={{ color: t.text }}>А что, если изменить?</h2>
      <p className="mb-8 text-sm" style={{ color: t.textSub }}>
        Двигай ползунки — и смотри, сколько часов освободится за 10 лет.
      </p>

      <div className="flex flex-col gap-6 mb-8">
        <SliderField label="Телефон / соцсети" emoji="📱" value={mod.phoneHours}
          min={0} max={12} step={0.5} onChange={setM('phoneHours')} t={t} />
        <SliderField label="Работа / учёба" emoji="💼" value={mod.workHours}
          min={0} max={14} step={0.5} onChange={setM('workHours')} t={t} unit="ч за будний день" />
        <SliderField label="Дорога туда и обратно в один будний день" emoji="🚌" value={mod.commuteHours}
          min={0} max={6} step={0.25} onChange={setM('commuteHours')} t={t}
          hint="весь путь за день" formatValue={formatCommuteTime} />
        <SliderField label="Сон" emoji="😴" value={mod.sleepHours}
          min={0} max={12} step={0.5} onChange={setM('sleepHours')} t={t} />
      </div>

      <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard }}>
        <CompareRow label="Телефон" origH={orig.phone}    adjH={adjusted.phone}    color={t.chartColors[1]} emoji="📱" />
        <CompareRow label="Работа"  origH={orig.work}     adjH={adjusted.work}     color={t.chartColors[2]} emoji="💼" />
        <CompareRow label="Дорога"  origH={orig.commute}  adjH={adjusted.commute}  color={t.chartColors[3]} emoji="🚌" />
        <CompareRow label="Сон"     origH={orig.sleeping} adjH={adjusted.sleeping} color={t.chartColors[0]} emoji="😴" />
      </div>

      {totalSaved > 0 ? (
        <div className="rounded-2xl p-5 mb-8 text-center" style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7' }}>
          <div className="text-sm mb-1" style={{ color: '#065F46' }}>Ты освободишь за 10 лет</div>
          <div className="font-display text-5xl font-black mb-1" style={{ color: '#059669' }}>
            <AnimatedNumber value={Math.round(totalSaved)} duration={800} />
          </div>
          <div className="font-display text-xl font-bold" style={{ color: '#059669' }}>часов = {hoursToYears(totalSaved)}</div>
        </div>
      ) : (
        <div className="rounded-2xl p-5 mb-8 text-center" style={{ background: t.bgCard }}>
          <div className="text-sm" style={{ color: t.textSub }}>Измени хоть один ползунок, чтобы увидеть потенциал</div>
        </div>
      )}

      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold transition-all hover:opacity-90"
        style={{ background: t.accent, color: t.accentContrast }}>
        Куда потратить это время? →
      </button>
    </PageWrap>
  )
}

// ─── DESTINATIONS PAGE ────────────────────────────────────────────────────────

function DestinationsPage({ data, onBack, onReset, onRestart, t }: {
  data: UserData; onBack: () => void; onReset: () => void; onRestart: () => void; t: Theme
}) {
  const stats      = useMemo(() => calcStats(data, 10), [data])
  const savedHours = Math.max(0, data.phoneHours - 2) * WEEKDAY_RATIO * 365.25 * 10

  return (
    <PageWrap t={t}>
      <Nav onBack={onBack} onReset={onReset} t={t} />

      <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgAccentLight }}>
        <div className="font-display text-3xl font-black" style={{ color: t.text }}>Куда потратить время?</div>
      </div>

      <p className="mb-2 text-sm" style={{ color: t.textSub }}>
        У тебя есть <strong style={{ color: t.text }}>{fmt(stats.total)}</strong> часов в следующие 10 лет. Вот что можно успеть:
      </p>
      {savedHours > 0 && (
        <p className="mb-8 text-sm" style={{ color: t.textSub }}>
          Если сократить телефон до 2 ч/день — освободится ещё{' '}
          <strong style={{ color: t.accent }}>{fmt(savedHours)} ч</strong>.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 mb-10">
        {DESTINATION_IDEAS.map(idea => {
          const canDo = Math.floor(stats.total / idea.hours)
          return (
            <div key={idea.title}
              className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{ background: t.bgCard }}>
              <div className="text-3xl w-12 text-center flex-shrink-0">{idea.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base font-bold" style={{ color: t.text }}>{idea.title}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textSub }}>{idea.desc}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display text-xl font-black" style={{ color: t.accent }}>×{canDo}</div>
                <div className="text-xs" style={{ color: t.textMuted }}>~{idea.hours} ч</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl p-6 mb-8 text-center"
        style={{ background: `linear-gradient(135deg, ${t.bgAccentLight} 0%, ${t.bgCard} 100%)` }}>
        <div className="font-display text-2xl font-black mb-2" style={{ color: t.text }}>
          Время — единственный невозобновляемый ресурс
        </div>
        <p className="text-sm" style={{ color: t.textSub }}>
          Каждый час ты выбираешь сам. Даже осознание этого — уже шаг.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold border-2 transition-all"
          style={{ borderColor: t.accent, color: t.accent }}>
          Изменить данные и пересчитать
        </button>
        <button onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold transition-all hover:opacity-90"
          style={{ background: t.accent, color: t.accentContrast }}>
          Начать заново ↺
        </button>
      </div>
    </PageWrap>
  )
}

// ─── Step Dots ────────────────────────────────────────────────────────────────

const STEPS: Page[] = ['landing', 'input', 'habits', 'results', 'future', 'whatif', 'destinations']

function StepDots({ page, t }: { page: Page; t: Theme }) {
  const idx = STEPS.indexOf(page)
  if (idx <= 0) return null
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5">
      {STEPS.slice(1).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300"
          style={{
            width: i + 1 === idx ? 20 : 8,
            height: 8,
            background: i + 1 === idx ? t.accent : i + 1 < idx ? `${t.accent}88` : t.border,
          }} />
      ))}
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]           = useState<Page>('landing')
  const [userData, setUserData]   = useState<UserData>(DEFAULT_DATA)
  const [habitsData, setHabitsData] = useState<HabitsData>(DEFAULT_HABITS)
  const [colorTheme, setColorTheme] = useState<ColorTheme>('colorful')

  const t = THEMES[colorTheme]
  const go = (p: Page) => setPage(p)

  useEffect(() => {
    document.body.style.background = t.bg
    document.body.style.transition = 'background 0.3s'
  }, [t.bg])

  return (
    <div data-theme={colorTheme} style={{ background: t.bg, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
      <StepDots page={page} t={t} />

      {page === 'landing' && (
        <LandingPage onStart={() => go('input')} theme={colorTheme} setTheme={setColorTheme} t={t} />
      )}
      {page === 'input' && (
        <InputPage initial={userData} onSubmit={d => { setUserData(d); go('habits') }} onBack={() => go('landing')} t={t} />
      )}
      {page === 'habits' && (
        <HabitsPage initial={habitsData} onSubmit={h => { setHabitsData(h); go('results') }} onBack={() => go('input')} t={t} />
      )}
      {page === 'results' && (
        <ResultsPage data={userData} habits={habitsData} onNext={() => go('future')} onBack={() => go('habits')} onReset={() => go('input')} t={t} />
      )}
      {page === 'future' && (
        <FuturePage data={userData} habits={habitsData} onNext={() => go('whatif')} onBack={() => go('results')} onReset={() => go('input')} t={t} />
      )}
      {page === 'whatif' && (
        <WhatIfPage data={userData} onNext={() => go('destinations')} onBack={() => go('future')} onReset={() => go('input')} t={t} />
      )}
      {page === 'destinations' && (
        <DestinationsPage data={userData} onBack={() => go('whatif')} onReset={() => go('input')}
          onRestart={() => { setUserData(DEFAULT_DATA); setHabitsData(DEFAULT_HABITS); go('landing') }} t={t} />
      )}
    </div>
  )
}
