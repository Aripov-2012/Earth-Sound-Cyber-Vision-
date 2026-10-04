import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as Tone from 'tone'
import { ArrowDownRight, ArrowUpRight, AudioLines, BookOpen, Building2, CalendarDays, ChevronDown, CircleHelp, Cloud, Compass, Earth, FileDown, Flame, Headphones, Heart, HeartPulse, Leaf, LoaderCircle, MapPin, MessageCircle, Pause, Play, Radio, Satellite, Send, SlidersHorizontal, Snowflake, Sparkles, Users, Wallet, Waves, Wind, Wifi, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { localeDateTag, supportedLocales, translate } from './i18n.js'

const metrics = [
  { id: 'temperature', label: 'Temperature', unit: '°C', icon: Flame, color: '#ff8a5b' },
  { id: 'seaLevel', label: 'Sea level', unit: 'mm', icon: Waves, color: '#5ac8fa' },
  { id: 'clouds', label: 'Cloud cover', unit: '%', icon: Cloud, color: '#af98ff' },
  { id: 'wildfires', label: 'Wildfires', unit: 'M ha', icon: Flame, color: '#ff665e' },
  { id: 'vegetation', label: 'Vegetation', unit: 'NDVI', icon: Leaf, color: '#8bd49c' },
]
const humanMetrics = [
  { id: 'population', label: 'Population', unit: 'M people', icon: Users, color: '#70d9c0', start: 24.8, end: 37.5, min: 24, max: 40, wave: 0.22, curve: 1.36, decimals: 1 },
  { id: 'medianAge', label: 'Median age', unit: 'years', icon: CalendarDays, color: '#9c9aff', start: 20.1, end: 28.8, min: 19, max: 31, wave: 0.2, curve: 1, decimals: 1 },
  { id: 'salary', label: 'Average salary', unit: 'M UZS', icon: Wallet, color: '#f1b66f', start: 0.08, end: 5.1, min: 0, max: 6.2, wave: 0.08, curve: 1.8, decimals: 1 },
  { id: 'happinessRank', label: 'Happiness rank', unit: 'world rank', icon: Heart, color: '#ef8d9a', start: 65, end: 43, min: 35, max: 80, wave: 1.7, curve: 1.05, decimals: 0 },
  { id: 'lifeExpectancy', label: 'Life expectancy', unit: 'years', icon: HeartPulse, color: '#86c9ee', start: 66.1, end: 74.3, min: 64, max: 77, wave: 0.2, curve: 1.15, decimals: 1 },
  { id: 'literacy', label: 'Adult literacy', unit: '%', icon: BookOpen, color: '#c4a5f5', start: 98.6, end: 99.9, min: 98, max: 100, wave: 0.06, curve: 1, decimals: 1 },
  { id: 'gdpPerCapita', label: 'GDP per capita', unit: 'k USD', icon: Building2, color: '#e3a875', start: 0.7, end: 2.9, min: 0.4, max: 4, wave: 0.08, curve: 1.7, decimals: 1 },
  { id: 'internetAccess', label: 'Internet access', unit: '%', icon: Wifi, color: '#64c9d2', start: 0.5, end: 85, min: 0, max: 95, wave: 1.1, curve: 1.55, decimals: 0 },
  { id: 'urbanization', label: 'Urban population', unit: '%', icon: Building2, color: '#c8d77d', start: 37, end: 51, min: 30, max: 58, wave: 0.35, curve: 1, decimals: 0 },
]
const locations = [
  { id: 'Global', detail: 'Whole planet', code: 'GLB' },
  { id: 'Uzbekistan', detail: 'Central Asia', code: 'UZB' },
  { id: 'USA', detail: 'North America', code: 'USA' },
  { id: 'Japan', detail: 'East Asia', code: 'JPN' },
]
const presets = [
  { id: 'global', name: 'Global warm up', metric: 'temperature', location: 'Global', icon: Earth, tint: 'coral' },
  { id: 'arctic', name: 'Arctic ice melt', metric: 'seaLevel', location: 'Global', icon: Snowflake, tint: 'blue' },
  { id: 'uzbekistan', name: 'Uzbekistan climate', metric: 'temperature', location: 'Uzbekistan', icon: Compass, tint: 'green' },
]
const humanPresets = [
  { id: 'young-country', name: 'A young country', metric: 'population', location: 'Uzbekistan', icon: Users, tint: 'green', layer: 'human' },
  { id: 'longer-lives', name: 'Living longer', metric: 'lifeExpectancy', location: 'Uzbekistan', icon: HeartPulse, tint: 'blue', layer: 'human' },
  { id: 'connected-country', name: 'Connected Uzbekistan', metric: 'internetAccess', location: 'Uzbekistan', icon: Wifi, tint: 'coral', layer: 'human' },
]
const ranges = {
  temperature: { min: 13.72, max: 15.21, base: 14.1, trend: 0.034, wave: 0.14 },
  seaLevel: { min: 0, max: 110, base: 5, trend: 3.75, wave: 9.5 },
  clouds: { min: 50, max: 67, base: 59, trend: 0.12, wave: 3.6 },
  wildfires: { min: 5, max: 11, base: 7.1, trend: 0.06, wave: 0.75 },
  vegetation: { min: 0.39, max: 0.57, base: 0.48, trend: 0.001, wave: 0.026 },
  population: { min: 24, max: 40 },
  medianAge: { min: 19, max: 31 },
  salary: { min: 0, max: 6.2 },
  happinessRank: { min: 35, max: 80 },
  lifeExpectancy: { min: 64, max: 77 },
  literacy: { min: 98, max: 100 },
  gdpPerCapita: { min: 0.4, max: 4 },
  internetAccess: { min: 0, max: 95 },
  urbanization: { min: 30, max: 58 },
}
const offsets = { Global: 0, Uzbekistan: 0.31, USA: -0.16, Japan: 0.12 }
const humanMappings = {
  population: ['pitch', 'populationGrowth'],
  medianAge: ['timbre', 'ageProfile'],
  salary: ['amplitude', 'monthlyWages'],
  happinessRank: ['harmony', 'worldRanking'],
  lifeExpectancy: ['duration', 'lifeExpectancy'],
  literacy: ['consonance', 'adultLiteracy'],
  gdpPerCapita: ['pitchRange', 'gdpPerPerson'],
  internetAccess: ['pulseDensity', 'digitalAccess'],
  urbanization: ['toneColor', 'urbanShare'],
}
const assistantWelcome = {
  role: 'assistant',
  text: 'Hi! I am the Gemini assistant for Earth Jukebox. I can explain the selected signal, chart, or how data becomes sound.',
}

function makeSeries(metricId, locationId) {
  const range = ranges[metricId]
  return Array.from({ length: 27 }, (_, index) => {
    const offset = offsets[locationId]
    const cycle = Math.sin(index * 0.62 + offset * 4.1) * range.wave + Math.cos(index * 0.22 + offset) * range.wave * 0.38
    const regionalTrend = locationId === 'Uzbekistan' && metricId === 'temperature' ? 0.004 : 0
    const regionalScale = locationId === 'Japan' && metricId === 'clouds' ? 1.13 : 1
    const value = range.base + index * (range.trend + regionalTrend) + cycle * regionalScale
    return { year: 2000 + index, value: Math.max(range.min, Math.min(range.max, Number(value.toFixed(2)))) }
  })
}

function makeHumanSeries(metricId) {
  const metric = humanMetrics.find((item) => item.id === metricId)
  return Array.from({ length: 27 }, (_, index) => {
    const progress = index / 26
    const trend = metric.start + (metric.end - metric.start) * progress ** metric.curve
    const variation = Math.sin(index * 0.68 + metric.start) * metric.wave * Math.sin(Math.PI * progress)
    const value = index === 26 ? metric.end : Math.max(metric.min, Math.min(metric.max, trend + variation))
    return { year: 2000 + index, value: Number(value.toFixed(metric.decimals)) }
  })
}

function SpectrumCanvas({ analyser, playing, color, label }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    let frame = 0
    let animationFrame = 0
    let width = 0
    let height = 0
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const draw = () => {
      frame += 1
      context.clearRect(0, 0, width, height)
      const center = height * 0.52
      const values = analyser?.getValue()
      const bins = values instanceof Float32Array ? values : []
      const count = 96
      const gap = width / count
      context.globalCompositeOperation = 'lighter'
      for (let index = 0; index < count; index += 1) {
        const bin = bins.length ? Math.floor((index / count) * bins.length * 0.72) : 0
        const strength = bins.length ? Math.max(0, Math.min(1, (bins[bin] + 92) / 72)) : 0
        const drift = playing ? Math.abs(Math.sin(frame * 0.018 + index * 0.17)) * 0.13 : 0
        const amplitude = ((playing ? 0.13 : 0.045) + strength * 0.72 + drift) * height * 0.42
        const x = index * gap + gap * 0.5
        const hue = index < count * 0.57 ? color : '#a989ff'
        context.fillStyle = `${hue}99`
        context.shadowColor = hue
        context.shadowBlur = playing ? 12 : 5
        context.fillRect(x, center - amplitude, Math.max(1.5, gap * 0.34), amplitude * 2)
      }
      context.beginPath()
      for (let index = 0; index <= 180; index += 1) {
        const x = (index / 180) * width
        const bin = bins.length ? Math.floor((index / 180) * bins.length * 0.66) : 0
        const strength = bins.length ? Math.max(0, Math.min(1, (bins[bin] + 100) / 78)) : 0
        const wave = Math.sin(index * 0.22 + frame * 0.025) * (playing ? 7 + strength * 24 : 2.5)
        if (index === 0) context.moveTo(x, center + wave)
        else context.lineTo(x, center + wave)
      }
      context.strokeStyle = color
      context.globalAlpha = playing ? 0.87 : 0.42
      context.lineWidth = 1.15
      context.shadowColor = color
      context.shadowBlur = 14
      context.stroke()
      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      animationFrame = window.requestAnimationFrame(draw)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    animationFrame = window.requestAnimationFrame(draw)
    return () => { observer.disconnect(); window.cancelAnimationFrame(animationFrame) }
  }, [analyser, color, playing])
  return <canvas className="spectrum-canvas" ref={canvasRef} aria-label={label} role="img" />
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{label}</span><strong>{payload[0].value} {unit}</strong></div>
}

function ReportChart({ series, color, label }) {
  const width = 700
  const height = 230
  const values = series.map((point) => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max((maximum - minimum) * 0.14, 0.05)
  const points = series.map((point, index) => {
    const x = 18 + (index / (series.length - 1)) * (width - 36)
    const y = height - 24 - ((point.value - minimum + padding) / (maximum - minimum + padding * 2)) * (height - 48)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point}`).join(' ')
  const area = `${line} L ${width - 18},${height - 24} L 18,${height - 24} Z`

  return (
    <svg className="report-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {[0, 1, 2, 3].map((lineIndex) => <line key={lineIndex} x1="18" x2={width - 18} y1={28 + lineIndex * 50} y2={28 + lineIndex * 50} stroke="#263a45" strokeDasharray="3 7" />)}
      <path d={area} fill={`${color}24`} />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width - 18} cy={Number(points.at(-1).split(',')[1])} r="5" fill={color} />
      <text x="18" y={height - 4} fill="#8da1ad" fontSize="11">2000</text>
      <text x={width / 2} y={height - 4} textAnchor="middle" fill="#8da1ad" fontSize="11">2013</text>
      <text x={width - 18} y={height - 4} textAnchor="end" fill="#8da1ad" fontSize="11">2026</text>
    </svg>
  )
}

function formatReportTimestamp(locale) {
  return new Intl.DateTimeFormat(localeDateTag[locale] ?? 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
}

function App() {
  const [locale, setLocale] = useState('en')
  const [layerId, setLayerId] = useState('earth')
  const [metricId, setMetricId] = useState('temperature')
  const [locationId, setLocationId] = useState('Global')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(68)
  const [presetId, setPresetId] = useState('global')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [audioGraph, setAudioGraph] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportToast, setExportToast] = useState('')
  const [reportQr, setReportQr] = useState('')
  const [spectrumSnapshot, setSpectrumSnapshot] = useState('')
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null)
  const [reportSnapshot, setReportSnapshot] = useState(null)
  const [utilityPanel, setUtilityPanel] = useState(null)
  const [assistantMessages, setAssistantMessages] = useState([assistantWelcome])
  const [assistantDraft, setAssistantDraft] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantConfigured, setAssistantConfigured] = useState(null)
  const reportRef = useRef(null)
  const assistantLogRef = useRef(null)
  const toastTimer = useRef(null)
  const audioRef = useRef(null)
  const sequenceIndex = useRef(0)
  const t = (key) => translate(locale, key)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const chooseLocale = (nextLocale) => {
    if (!supportedLocales.includes(nextLocale)) return
    setLocale(nextLocale)
    setAssistantMessages([{ role: 'assistant', text: translate(nextLocale, 'assistant.welcome') }])
    setAssistantDraft('')
  }

  const series = useMemo(() => layerId === 'human' ? makeHumanSeries(metricId) : makeSeries(metricId, locationId), [layerId, metricId, locationId])
  const visibleMetrics = layerId === 'human' ? humanMetrics : metrics
  const visiblePresets = layerId === 'human' ? humanPresets : presets
  const selectedMetric = visibleMetrics.find((item) => item.id === metricId)
  const metric = {
    ...selectedMetric,
    label: t(`metric.${metricId}`),
    unit: layerId === 'human' ? t(`unit.${metricId}`) : selectedMetric.unit,
  }
  const location = locations.find((item) => item.id === locationId)
  const locationName = t(`location.${location.id}`)
  const locationDetail = t(`locationDetail.${location.id}`)
  const selectedPoint = series.find((point) => point.year === selectedYear) ?? series.at(-1)
  const previousPoint = series.find((point) => point.year === selectedYear - 1) ?? series.at(-2)
  const difference = selectedPoint.value - previousPoint.value
  const chartMin = Math.min(...series.map((point) => point.value))
  const chartMax = Math.max(...series.map((point) => point.value))
  const chartPadding = Math.max((chartMax - chartMin) * 0.18, 0.05)
  const bpm = Math.round(66 + ((selectedPoint.value - ranges[metricId].min) / (ranges[metricId].max - ranges[metricId].min)) * 64)
  const changeIsGood = metricId === 'happinessRank' ? difference <= 0 : difference >= 0
  const changeValue = `${difference >= 0 ? '+' : ''}${difference.toFixed(metric.decimals ?? 2)}`
  const regionTemperature = useMemo(() => makeSeries('temperature', locationId).find((point) => point.year === selectedYear), [locationId, selectedYear])
  const isUzbekistan = locationId === 'Uzbekistan'
  const reportMetrics = [
    { label: t('report.temperature'), value: `${regionTemperature.value.toFixed(2)} °C`, detail: `${locationName} · ${selectedYear}`, color: '#ff9a72' },
    { label: t('report.population'), value: isUzbekistan ? t('report.populationValue') : t('report.unavailable'), detail: isUzbekistan ? t('report.populationDetail') : t('report.onlyUzbekistan'), color: '#70d9c0' },
    { label: t('report.income'), value: isUzbekistan ? t('report.gdpValue') : t('report.unavailable'), detail: isUzbekistan ? t('report.gdpDetail') : t('report.onlyUzbekistan'), color: '#e3a875' },
    { label: t('report.happiness'), value: isUzbekistan ? t('report.rankValue') : t('report.unavailable'), detail: isUzbekistan ? t('report.rankDetail') : t('report.onlyUzbekistan'), color: '#ef8d9a' },
  ]
  const reportContext = [
    [t('report.medianAge'), locale === 'en' ? '28.8 years' : locale === 'ru' ? '28,8 года' : '28,8 yil'],
    [t('report.lifeExpectancy'), locale === 'en' ? '74.3 years' : locale === 'ru' ? '74,3 года' : '74,3 yil'],
    [t('report.literacy'), '99.9%'], [t('report.internet'), '85%+'], [t('report.urban'), '51%'],
  ]
  const earthMappings = {
    temperature: ['pitch', 'frequency'], seaLevel: ['tempo', 'pulse'], clouds: ['reverb', 'duration'],
    wildfires: ['intensity', 'distortion'], vegetation: ['harmony', 'timbre'],
  }
  const mapping = (layerId === 'human' ? humanMappings[metricId] : earthMappings[metricId]).map((key) => t(`mapping.${key}`))
  const activeNarrative = t(`narrative.${metricId}`)
  const currentReportView = {
    locale,
    layerId,
    metric: { ...metric },
    location: { ...location, displayName: locationName, displayDetail: locationDetail },
    selectedYear,
    selectedPoint: { ...selectedPoint },
    playing,
    bpm,
    difference,
    changeValue,
    mapping: [...mapping],
    series: series.map((point) => ({ ...point })),
    narrative: activeNarrative,
    regionTemperature: { ...regionTemperature },
    isUzbekistan,
    metrics: reportMetrics.map((item) => ({ ...item })),
    context: reportContext.map((item) => [...item]),
  }
  const reportView = reportSnapshot ?? currentReportView
  const rt = (key) => translate(reportView.locale, key)

  useEffect(() => () => {
    const graph = audioRef.current
    if (graph) Object.values(graph).forEach((node) => node.dispose())
  }, [])

  useEffect(() => {
    if (utilityPanel !== 'assistant') return undefined
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setAssistantConfigured(Boolean(data.configured)))
      .catch(() => setAssistantConfigured(false))
    return () => controller.abort()
  }, [utilityPanel])

  useEffect(() => {
    if (utilityPanel === 'assistant' && assistantLogRef.current) {
      assistantLogRef.current.scrollTop = assistantLogRef.current.scrollHeight
    }
  }, [assistantMessages, assistantLoading, utilityPanel])

  useEffect(() => {
    if (!playing) return undefined
    const interval = window.setInterval(() => {
      const graph = audioRef.current
      if (!graph) return
      const index = sequenceIndex.current % series.length
      const point = series[index]
      const range = ranges[metricId]
      const rawPosition = (point.value - range.min) / (range.max - range.min)
      const normalized = layerId === 'human' && metricId === 'happinessRank' ? 1 - rawPosition : rawPosition
      const midi = Math.round(46 + normalized * 34)
      const duration = metricId === 'clouds' ? `${0.25 + normalized * 0.75}s`
        : layerId === 'human' && metricId === 'lifeExpectancy' ? `${0.2 + normalized * 0.55}s` : '8n'
      const fire = layerId === 'earth' && metricId === 'wildfires' ? normalized : 0.12
      graph.distortion.distortion = Math.min(0.78, 0.08 + fire * 0.66)
      graph.reverb.wet.rampTo(metricId === 'clouds' ? 0.12 + normalized * 0.54 : 0.18, 0.1)
      const humanOscillators = { population: 'triangle', medianAge: 'sine', salary: 'sawtooth', happinessRank: 'triangle', lifeExpectancy: 'sine', literacy: 'sine', gdpPerCapita: 'square', internetAccess: 'triangle', urbanization: 'sawtooth' }
      graph.main.oscillator.type = layerId === 'human' ? humanOscillators[metricId] : metricId === 'vegetation' ? 'triangle' : 'sine'
      graph.main.volume.rampTo(layerId === 'human' && metricId === 'salary' ? -12 + normalized * 7 : 0, 0.1)
      graph.main.triggerAttackRelease(Tone.Frequency(midi, 'midi'), duration, undefined, 0.28 + fire * 0.64)
      const addsHarmony = metricId === 'vegetation' || layerId === 'human' && ['happinessRank', 'literacy'].includes(metricId)
      if (addsHarmony && normalized > 0.3) graph.harmony.triggerAttackRelease(Tone.Frequency(midi + 7, 'midi'), duration, undefined, 0.17 + normalized * 0.22)
      setSelectedYear(point.year)
      sequenceIndex.current = (index + 1) % series.length
    }, Math.round(60_000 / bpm))
    return () => window.clearInterval(interval)
  }, [bpm, layerId, metricId, playing, series])

  const handlePlay = async () => {
    if (playing) { setPlaying(false); return }
    await Tone.start()
    let graph = audioRef.current
    if (!graph) {
      const distortion = new Tone.Distortion(0.12)
      const reverb = new Tone.Reverb({ decay: 2.7, wet: 0.24 })
      await reverb.ready
      const analyser = new Tone.Analyser('fft', 128)
      const main = new Tone.Synth({ envelope: { attack: 0.025, decay: 0.2, sustain: 0.34, release: 0.8 } })
      const harmony = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.07, decay: 0.24, sustain: 0.32, release: 0.9 } })
      main.connect(distortion)
      harmony.connect(distortion)
      distortion.connect(reverb)
      reverb.connect(analyser)
      reverb.toDestination()
      graph = { main, harmony, distortion, reverb, analyser }
      audioRef.current = graph
      setAudioGraph(graph)
      Tone.Destination.volume.value = -38 + volume * 0.32
    }
    sequenceIndex.current = Math.max(0, selectedYear - 2000)
    setPlaying(true)
  }

  const changeVolume = (event) => {
    const next = Number(event.target.value)
    setVolume(next)
    if (Tone.getContext().state === 'running') Tone.Destination.volume.rampTo(-38 + next * 0.32, 0.08)
  }
  const choosePreset = (preset) => {
    setLayerId(preset.layer ?? 'earth')
    setMetricId(preset.metric)
    setLocationId(preset.location)
    setSelectedYear(2026)
    setPresetId(preset.id)
  }
  const chooseLayer = (nextLayer) => {
    setLayerId(nextLayer)
    setMetricId(nextLayer === 'human' ? 'population' : 'temperature')
    setLocationId(nextLayer === 'human' ? 'Uzbekistan' : 'Global')
    setSelectedYear(2026)
    setPresetId('')
  }
  const sendAssistantMessage = async (prompt = assistantDraft) => {
    const question = prompt.trim()
    if (!question || assistantLoading) return
    const conversation = [...assistantMessages, { role: 'user', text: question }].slice(-12)
    setAssistantMessages(conversation)
    setAssistantDraft('')
    setAssistantLoading(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          messages: conversation,
          context: {
            layer: t(layerId === 'human' ? 'dataset.human' : 'dataset.earth'),
            metric: metric.label,
            location: locationName,
            year: selectedYear,
            value: `${selectedPoint.value} ${metric.unit}`,
            yearOverYear: changeValue,
            tempo: `${bpm} BPM`,
            narrative: activeNarrative,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось получить ответ Gemini.')
      setAssistantMessages((current) => [...current, { role: 'assistant', text: data.reply }].slice(-14))
    } catch (error) {
      setAssistantConfigured(false)
      setAssistantMessages((current) => [...current, {
        role: 'assistant',
        text: error instanceof Error ? error.message : t('assistant.genericError'),
        isError: true,
      }].slice(-14))
    } finally {
      setAssistantLoading(false)
    }
  }
  const handleExportPDF = async () => {
    if (isExporting || !reportRef.current) return
    setIsExporting(true)
    setExportToast(t('toast.generating'))
    setReportGeneratedAt(formatReportTimestamp(locale))
    setReportSnapshot(currentReportView)

    try {
      const [{ default: html2canvas }, { jsPDF }, { default: QRCode }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
        import('qrcode'),
      ])
      const appUrl = `${window.location.origin}${window.location.pathname}`
      const qr = await QRCode.toDataURL(appUrl, {
        width: 220,
        margin: 1,
        color: { dark: '#15333b', light: '#e4f4f2' },
      })
      const liveSpectrum = document.querySelector('.spectrum-canvas')
      setReportQr(qr)
      setSpectrumSnapshot(liveSpectrum?.toDataURL('image/png') ?? '')
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await document.fonts.ready

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
      const pages = Array.from(reportRef.current.querySelectorAll('.report-page'))
      for (const [index, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
          backgroundColor: '#080b10',
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDocument) => {
            const printStyles = clonedDocument.createElement('style')
            printStyles.textContent = `
              html, body { width: 794px !important; min-width: 794px !important; margin: 0 !important; background: #080b10 !important; }
              .report-page { width: 794px !important; height: 1123px !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .report-page, .report-page * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            `
            clonedDocument.head.appendChild(printStyles)
            const clonedRoot = clonedDocument.querySelector('.report-render-root')
            if (clonedRoot) {
              clonedRoot.style.left = '0px'
              clonedRoot.style.top = '0px'
              clonedRoot.style.zIndex = '100'
            }
          },
        })
        if (index > 0) pdf.addPage('a4', 'portrait')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }

      const safeLocation = location.id.replace(/[^a-z0-9]+/gi, '_')
      pdf.setProperties({ title: `${translate(locale, 'report.title')} - ${translate(locale, 'report.subtitle')}` })
      pdf.save(`Earth_Jukebox_Report_${safeLocation}_${selectedYear}.pdf`)
      setExportToast(t('toast.downloaded'))
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setExportToast(''), 3200)
    } catch (error) {
      console.error('PDF report generation failed:', error)
      setExportToast(t('toast.failed'))
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setExportToast(''), 4200)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-main" id="top">
        <header className="topbar">
          <div className="brand-lockup"><div className="brand-mark"><Earth size={19} strokeWidth={1.5} /></div><div><span className="brand-name">EARTH / INFORMATION JUKEBOX</span><span className="brand-subtitle">NASA SPACE APPS CHALLENGE <span>·</span> 2026</span></div></div>
          <div className="topbar-status">
            <span className="live-status"><span className="status-dot" /> {t('header.systems')}</span>
            <span className="topbar-divider" />
            <span className="mission-code">{t('header.mission')}</span>
            <div className="language-switch" role="group" aria-label={t('language.label')}>
              {supportedLocales.map((code) => <button key={code} type="button" className={locale === code ? 'active' : ''} aria-pressed={locale === code} onClick={() => chooseLocale(code)}>{code.toUpperCase()}</button>)}
            </div>
            <button className="utility-trigger" type="button" onClick={() => setUtilityPanel(utilityPanel === 'assistant' ? null : 'assistant')} aria-expanded={utilityPanel === 'assistant'}><MessageCircle size={15} /><span>{t('header.assistant')}</span></button>
            <button className="utility-trigger" type="button" onClick={() => setUtilityPanel(utilityPanel === 'help' ? null : 'help')} aria-expanded={utilityPanel === 'help'}><CircleHelp size={15} /><span>{t('header.help')}</span></button>
            <button className="export-button" type="button" onClick={handleExportPDF} disabled={isExporting} aria-busy={isExporting}>{isExporting ? <LoaderCircle className="export-spinner" size={16} /> : <FileDown size={16} />}<span>{t('header.export')}</span></button>
            <button className="icon-button topbar-profile" aria-label={t('header.settings')}><SlidersHorizontal size={17} /></button>
          </div>
        </header>
        {exportToast && <div className={`export-toast ${isExporting ? 'is-loading' : ''}`} role="status" aria-live="polite">{isExporting && <LoaderCircle className="export-spinner" size={15} />}{exportToast}</div>}

        <main className="dashboard">
          <motion.aside className="control-column" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
            <div className="section-kicker"><span>01</span> {t('hero.kicker')}</div>
            <h1>{layerId === 'human' ? <>{t('hero.humanTop')}<br /><em>{t('hero.humanBottom')}</em></> : <>{t('hero.earthTop')}<br /><em>{t('hero.earthBottom')}</em></>}</h1>
            <p className="intro-copy">{t(layerId === 'human' ? 'hero.humanIntro' : 'hero.earthIntro')}</p>
            <div className="layer-switch-block"><span className="block-label">{t('layer.title')}</span><div className="layer-switch" role="tablist" aria-label={t('layer.title')}>
              <button role="tab" aria-selected={layerId === 'earth'} className={layerId === 'earth' ? 'active' : ''} onClick={() => chooseLayer('earth')}><Earth size={14} /> {t('layer.earth')}</button>
              <button role="tab" aria-selected={layerId === 'human'} className={layerId === 'human' ? 'active' : ''} onClick={() => chooseLayer('human')}><Users size={14} /> {t('layer.human')}</button>
            </div></div>
            <div className="control-block metric-block"><div className="block-label">{t('metric.select')} <span>01 — {String(visibleMetrics.length).padStart(2, '0')}</span></div><div className="metric-list">
              {visibleMetrics.map((item, index) => { const Icon = item.icon; return <button className={`metric-option ${metricId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { setMetricId(item.id); setPresetId('') }} aria-pressed={metricId === item.id}><span className="metric-icon" style={{ '--metric-color': item.color }}><Icon size={16} /></span><span className="metric-label">{t(`metric.${item.id}`)}</span><span className="metric-number">{String(index + 1).padStart(2, '0')}</span></button> })}
            </div></div>
            <div className="control-block location-block"><label className="block-label" htmlFor="location-select">{t(layerId === 'human' ? 'location.focus' : 'location.area')}</label><div className="select-wrap"><MapPin size={15} /><select id="location-select" value={locationId} disabled={layerId === 'human'} onChange={(event) => { setLocationId(event.target.value); setPresetId('') }}>{locations.filter((item) => layerId !== 'human' || item.id === 'Uzbekistan').map((item) => <option key={item.id} value={item.id}>{t(`location.${item.id}`)} · {item.code}</option>)}</select><ChevronDown size={14} /></div><span className="location-detail">{locationDetail} <span>·</span> {location.code}</span></div>
            <div className="control-block preset-block"><div className="block-label">{t('preset.quick')} <span>{t('preset.presets')}</span></div><div className="preset-list">
              {visiblePresets.map((preset) => { const Icon = preset.icon; return <button className={`preset-option ${presetId === preset.id ? 'selected' : ''}`} key={preset.id} onClick={() => choosePreset(preset)} aria-pressed={presetId === preset.id}><span className={`preset-icon ${preset.tint}`}><Icon size={16} /></span><span>{t(`preset.${preset.id}`)}</span><ArrowUpRight className="preset-arrow" size={14} /></button> })}
            </div></div>
            <div className="volume-block"><div className="volume-heading"><span><Headphones size={15} /> {t('volume.title')}</span><strong>{volume}%</strong></div><input aria-label={t('volume.title')} type="range" min="0" max="100" value={volume} onChange={changeVolume} style={{ '--range-progress': `${volume}%` }} /><div className="volume-scale"><span>{t('volume.quiet')}</span><span>{t('volume.monitor')}</span></div></div>
          </motion.aside>

          <section className="visual-workspace" aria-label={t('workspace.aria')}>
            <div className="workspace-heading"><div><div className="section-kicker"><span>02</span> {t(layerId === 'human' ? 'workspace.human' : 'workspace.earth')}</div><h2>{metric.label} <span>·</span> {locationName}</h2></div><div className="signal-tag"><span className="signal-dot" /> {t('workspace.active')}</div></div>
            <motion.section className="visualizer-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}>
              <div className="panel-topline"><span><span className="live-square" /> {t('visual.frequency')}</span><span className="panel-readout">FFT / 128 <span>·</span> 44.1 KHZ</span></div>
              <div className="visualizer-stage"><div className="stage-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><span /><span /><span /></div><SpectrumCanvas analyser={audioGraph?.analyser} playing={playing} color={metric.color} label={t('visual.frequency')} /><span className="stage-coordinate coordinate-left">{location.code} / 00° 00′</span><span className="stage-coordinate coordinate-right">{selectedYear} / {metric.unit.toUpperCase()}</span><div className="stage-state"><AudioLines size={15} /><span>{t(playing ? 'visual.synthesizing' : 'visual.awaiting')}</span></div></div>
              <div className="visualizer-footer"><div className="value-readout"><span className="readout-label">{t('visual.selectedYear')}</span><strong>{selectedYear}</strong></div><div className="readout-divider" /><div className="value-readout"><span className="readout-label">{t('visual.observedValue')}</span><strong>{selectedPoint.value} <small>{metric.unit}</small></strong></div><div className="readout-divider" /><div className="value-readout tempo-readout"><span className="readout-label">{t('visual.tempo')}</span><strong>{bpm} <small>BPM</small></strong></div><span className="range-label">2000 <span>—</span> 2026</span></div>
            </motion.section>
            <motion.section className="chart-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.2 }}>
              <div className="chart-heading"><div><div className="section-kicker"><span>03</span> {t(layerId === 'human' ? 'chart.social' : 'chart.orbital')}</div><h3>{t('chart.title')}</h3></div><div className="chart-stat"><span>{selectedYear} {t(layerId === 'human' ? 'chart.change' : 'chart.anomaly')}</span><strong className={changeIsGood ? 'positive' : ''}>{changeValue} <small>{metric.unit}</small></strong></div></div>
              <div className="chart-plot"><ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{ top: 12, right: 5, left: -18, bottom: 0 }} onClick={(event) => { if (event?.activeLabel) setSelectedYear(Number(event.activeLabel)) }}><defs><linearGradient id="signal-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={metric.color} stopOpacity={0.24} /><stop offset="95%" stopColor={metric.color} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(156, 174, 192, 0.09)" vertical={false} /><XAxis dataKey="year" tick={{ fill: '#758398', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} /><YAxis domain={[chartMin - chartPadding, chartMax + chartPadding]} tickFormatter={(value) => Number(value).toFixed(metric.decimals ?? 1)} tick={{ fill: '#758398', fontSize: 10 }} tickLine={false} axisLine={false} tickCount={4} /><Tooltip content={<ChartTooltip unit={metric.unit} />} cursor={{ stroke: 'rgba(87, 214, 222, 0.42)', strokeDasharray: '3 5' }} /><Area type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} fill="url(#signal-fill)" activeDot={{ r: 4, fill: metric.color, stroke: '#071117', strokeWidth: 2 }} dot={false} /></AreaChart></ResponsiveContainer></div>
              <div className="chart-footnote"><span><span className="legend-stroke" /> {t('chart.annual')}</span><span>{layerId === 'human' ? t('chart.uzBrief') : t('chart.demo')} <span className="footnote-separator">/</span> {layerId === 'human' ? t('chart.interpolation') : t('chart.nasa')}</span></div>
            </motion.section>
          </section>

          <motion.aside className="insight-column" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.14 }}>
            <div className="insight-topline"><div className="section-kicker"><span>04</span> {t('insight.kicker')}</div><Sparkles size={16} /></div>
            <div className="insight-heading"><div className="insight-orbit"><Satellite size={21} /></div><span>{t('insight.listener')}</span></div>
            <h3>{t('insight.title')}<br /><em>{t('insight.titleEnd')}</em></h3><p className="narrative-copy">{activeNarrative}</p><div className="insight-divider" />
            <div className="observation-block"><span className="block-label">{t(layerId === 'human' ? 'insight.briefValue' : 'insight.latest')} <span>{selectedYear}</span></span><strong>{selectedPoint.value} <small>{metric.unit}</small></strong><span className={`observation-change ${changeIsGood ? 'improving' : ''}`}>{metricId === 'happinessRank' && difference < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {changeValue} {metric.unit} <span>{t('insight.yearOverYear')}</span></span></div>
            <div className="mapping-card"><div className="mapping-header"><span>{t('mapping.title')}</span><Radio size={15} /></div><div className="mapping-row"><span><span className="mapping-mark pitch" /> {mapping[0]}</span><strong>{mapping[1]}</strong></div><div className="mapping-row"><span><span className="mapping-mark pulse" /> {t('mapping.annualChange')}</span><strong>{t('mapping.noteSequence')}</strong></div><div className="mapping-row"><span><span className="mapping-mark space" /> {location.code} {t('mapping.region')}</span><strong>{t('mapping.soundField')}</strong></div></div>
            <div className="data-source"><div><Wind size={15} /><span>{t('source.title')}</span></div><p>{t(layerId === 'human' ? 'source.human' : 'source.earth')}</p></div>
            <div className="right-footer"><span><MapPin size={13} /> {locationDetail}</span><span><span className="status-dot" /> {t('player.standby')}</span></div>
          </motion.aside>
        </main>

        <footer className="player-bar"><div className="player-track"><div className={`track-art ${playing ? 'playing' : ''}`}><AudioLines size={19} /></div><div className="track-info"><strong>{metric.label} / {locationName}</strong><span>{t('player.series')} <span>·</span> {selectedYear}</span></div></div><div className="playback-controls"><div className="playback-caption"><span>{t(playing ? 'player.playing' : 'player.ready')}</span><span>{String(selectedYear).slice(-2)} / 26</span></div><button className={`play-button ${playing ? 'is-playing' : ''}`} onClick={handlePlay} aria-label={t(playing ? 'player.pause' : 'player.play')}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button><div className="playback-progress"><span style={{ width: `${((selectedYear - 2000) / 26) * 100}%` }} /></div></div><div className="player-meta"><span><span className="status-dot" /> {t(playing ? 'player.transmitting' : 'player.standby')}</span><span className="player-tempo"><AudioLines size={15} /> {bpm} BPM</span></div></footer>
      </div>

      {utilityPanel && <>
        <button className="utility-scrim" type="button" aria-label="Закрыть панель" onClick={() => setUtilityPanel(null)} />
        <aside className="utility-panel" aria-label={t(utilityPanel === 'assistant' ? 'assistant.panelTitle' : 'help.panelTitle')}>
          <header className="utility-panel-header">
            <div className="utility-panel-mark">{utilityPanel === 'assistant' ? <Sparkles size={18} /> : <CircleHelp size={18} />}</div>
            <div className="utility-panel-title"><strong>{t(utilityPanel === 'assistant' ? 'assistant.panelTitle' : 'help.panelTitle')}</strong><span>{t(utilityPanel === 'assistant' ? 'assistant.panelSubtitle' : 'help.panelSubtitle')}</span></div>
            <button className="utility-close" type="button" onClick={() => setUtilityPanel(null)} aria-label={t('common.close')}><X size={18} /></button>
          </header>
          <div className="utility-tabs" role="tablist" aria-label={t('help.tablist')}>
            <button type="button" role="tab" aria-selected={utilityPanel === 'assistant'} className={utilityPanel === 'assistant' ? 'active' : ''} onClick={() => setUtilityPanel('assistant')}><MessageCircle size={14} /> {t('assistant.tab')}</button>
            <button type="button" role="tab" aria-selected={utilityPanel === 'help'} className={utilityPanel === 'help' ? 'active' : ''} onClick={() => setUtilityPanel('help')}><CircleHelp size={14} /> {t('help.tab')}</button>
          </div>

          {utilityPanel === 'assistant' ? <>
            <div className="assistant-status"><span className={assistantConfigured ? 'status-dot' : 'status-dot offline'} />{assistantConfigured === null ? t('assistant.checking') : assistantConfigured ? t('assistant.online') : t('assistant.setupStatus')}</div>
            {!assistantConfigured && <p className="assistant-setup-note">{t('assistant.setup')}</p>}
            <div className="assistant-chat-log" ref={assistantLogRef} aria-live="polite">
              {assistantMessages.map((message, index) => <div className={`assistant-message ${message.role === 'user' ? 'user' : 'gemini'} ${message.isError ? 'error' : ''}`} key={`${message.role}-${index}`}><span className="message-author">{t(message.role === 'user' ? 'assistant.you' : 'assistant.name')}</span><p>{message.text}</p></div>)}
              {assistantLoading && <div className="assistant-message gemini loading"><span className="message-author">{t('assistant.name')}</span><p><LoaderCircle className="export-spinner" size={14} /> {t('assistant.loading')}</p></div>}
            </div>
            <div className="assistant-prompts"><span>{t('assistant.quickQuestion')}</span><div><button type="button" onClick={() => sendAssistantMessage(t('assistant.promptGraph'))}>{t('assistant.promptGraph')}</button><button type="button" onClick={() => sendAssistantMessage(t('assistant.promptSound'))}>{t('assistant.promptSound')}</button></div></div>
            <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); sendAssistantMessage() }}><textarea value={assistantDraft} onChange={(event) => setAssistantDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendAssistantMessage() } }} placeholder={t('assistant.placeholder')} rows={2} maxLength={1800} aria-label={t('assistant.placeholder')} /><button type="submit" disabled={assistantLoading || !assistantDraft.trim()} aria-label={t('assistant.send')}><Send size={17} /></button></form>
            <div className="assistant-context-note">{t('assistant.context')}: {metric.label} · {locationName} · {selectedYear}</div>
          </> : <div className="help-content">
            <div className="help-intro"><span>{t('help.brand')}</span><h2>{t('help.title')}<br /><em>{t('help.titleEnd')}</em></h2><p>{t('help.intro')}</p></div>
            <ol className="help-steps">
              {[1, 2, 3, 4, 5, 6].map((step) => <li key={step}><span>{String(step).padStart(2, '0')}</span><div><strong>{t(`help.step${step}.title`)}</strong><p>{t(`help.step${step}.body`).replace('Earth systems', t('layer.earth')).replace('Human & social', t('layer.human')).replace('Export PDF Report', t('header.export'))}</p></div></li>)}
            </ol>
            <div className="help-data-note"><Wind size={15} /><p>{t('help.dataNote')}</p></div>
          </div>}
        </aside>
      </>}

      <div className="report-render-root" ref={reportRef} aria-hidden="true">
        <article className="report-page report-page-one">
          <header className="report-header"><div className="report-brand"><div className="report-brand-mark"><Earth size={20} /></div><div><span>EARTH / INFORMATION JUKEBOX</span><small>{rt('report.nasaCredit')} · 2026</small></div></div><span className="report-id">{rt('report.page1')}</span></header>
          <div className="report-kicker">{rt('report.kicker')} <span>·</span> {rt('report.generated')} {reportGeneratedAt}</div>
          <h2 className="report-title">{rt('report.title')}<br /><span>{rt('report.subtitle')}</span></h2>
          <div className="report-meta-grid"><div><small>{rt('report.location')}</small><strong>{reportView.location.displayName} · {reportView.location.displayDetail}</strong></div><div><small>{rt('report.activeDataset')}</small><strong>{rt(reportView.layerId === 'human' ? 'dataset.human' : 'dataset.earth')} / {reportView.metric.label}</strong></div><div><small>{rt('report.window')}</small><strong>2000 — 2026</strong></div></div>
          <div className="report-section-label"><span>01</span> {rt('report.soundscape')}</div>
          <section className="report-status-hero"><div><small>{rt('report.selected')} · {reportView.selectedYear}</small><strong>{reportView.selectedPoint.value.toFixed(reportView.metric.decimals ?? 2)} <span>{reportView.metric.unit}</span></strong></div><span className="report-live-pill"><i /> {reportView.playing ? rt('player.transmitting') : rt('player.standby')}</span></section>
          <div className="report-stat-grid"><div><small>{rt('report.yearChange')}</small><strong>{reportView.changeValue} <span>{reportView.metric.unit}</span></strong></div><div><small>{rt('report.pulseTempo')}</small><strong>{reportView.bpm} <span>BPM</span></strong></div><div><small>{rt('report.sonificationMap')}</small><strong>{reportView.mapping[0]}</strong></div><div><small>{rt('report.audioEngine')}</small><strong>Tone.js · {rt('report.local')}</strong></div></div>
          <section className="report-narrative"><div><Sparkles size={15} /> {rt('report.narrative')}</div><p>{reportView.narrative}</p></section>
          <div className="report-section-label"><span>02</span> {rt('report.visuals')}</div>
          <div className="report-visual-grid"><section className="report-visual-card"><div className="report-visual-title">{rt('report.annualTrend')} <span>2000—2026</span></div><ReportChart series={reportView.series} color={reportView.metric.color} label={rt('report.annualTrend')} /><div className="report-visual-caption">{reportView.metric.label} · {reportView.location.displayName} · {reportView.metric.unit}</div></section><section className="report-visual-card"><div className="report-visual-title">{rt('report.liveSpectrum')} <span>FFT / 128</span></div>{spectrumSnapshot ? <img className="report-spectrum-image" src={spectrumSnapshot} alt={rt('report.liveSpectrum')} /> : <div className="report-spectrum-empty"><AudioLines size={30} /><span>{rt('report.liveSpectrum')}</span></div>}<div className="report-visual-caption">{rt(reportView.playing ? 'report.captureSynthesis' : 'report.captureSpectrum')} · {reportView.bpm} BPM</div></section></div>
          <footer className="report-page-footer"><span>EARTH INFORMATION JUKEBOX <i>·</i> {reportView.location.code} <i>·</i> {reportView.selectedYear}</span><span>{rt('report.pageFooter1')}</span></footer>
        </article>

        <article className="report-page report-page-two">
          <header className="report-header"><div className="report-brand"><div className="report-brand-mark"><Users size={20} /></div><div><span>{rt('report.regional')}</span><small>{rt('report.snapshot')}</small></div></div><span className="report-id">{rt('report.page2')}</span></header>
          <div className="report-kicker">{rt('report.regionBrief')} <span>·</span> {reportView.location.displayName.toUpperCase()} <span>·</span> 2026</div>
          <h2 className="report-title report-title-secondary">{rt('report.socioClimate')}<br /><span>{rt('report.climateMetrics')}</span></h2>
          <p className="report-page-intro">{rt('report.pageIntro')} {reportView.location.displayName}{rt('report.pairing')}</p>
          <div className="report-metric-grid">{reportView.metrics.map((item) => <section className="report-metric-card" key={item.label} style={{ '--report-accent': item.color }}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></section>)}</div>
          <div className="report-section-label"><span>03</span> {rt('report.people')} <span className="report-section-note">{reportView.isUzbekistan ? rt('report.uzSummary') : rt('report.noReference')}</span></div>
          <div className="report-context-grid">{reportView.context.map(([label, value]) => <div key={label}><small>{label}</small><strong>{reportView.isUzbekistan ? value : '—'}</strong></div>)}</div>
          <section className="report-note"><strong>{rt('report.reading')}</strong><p>{rt('report.socialSource')}</p></section>
          <section className="report-source-line"><div><span>{rt('report.dataset')}</span><strong>{rt(reportView.layerId === 'human' ? 'dataset.human' : 'dataset.earth')} · {reportView.metric.label}</strong></div><div><span>{rt('report.region')}</span><strong>{reportView.location.displayName} / {reportView.location.code}</strong></div><div><span>{rt('report.generated')}</span><strong>{reportGeneratedAt}</strong></div></section>
          <footer className="report-final-footer"><div><strong>{rt('report.nasaCredit')}</strong><span>Earth Information Jukebox · {rt('report.clientReport')}</span></div><div className="report-qr-block">{reportQr ? <img src={reportQr} alt={rt('report.openJukebox')} /> : <span>APP QR</span>}<small>{rt('report.openJukebox')}</small></div></footer>
          <div className="report-page-footer"><span>{rt('report.nasaCredit')} <i>·</i> EARTH INFORMATION JUKEBOX</span><span>{rt('report.pageFooter2')}</span></div>
        </article>
      </div>
    </div>
  )
}

export default App
