import { useState, useMemo, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import narratives from './narratives.json'

// 챕터별 오디오 파일 매핑
const STORAGE = 'https://storage.googleapis.com/taejae-fci.firebasestorage.app/tts';
const CHAPTER_AUDIO: Record<string, string> = {
  '서론': `${STORAGE}/narrative-tts-서론.mp3`,
  '1부': `${STORAGE}/narrative-tts-1부_디지털기술의특수성.mp3`,
  '2부': `${STORAGE}/narrative-tts-2부_개인의변화.mp3`,
  '3부': `${STORAGE}/narrative-tts-3부_공동체의변화.mp3`,
  '4부': `${STORAGE}/narrative-tts-4부_위협의지형.mp3`,
  '5부': `${STORAGE}/narrative-tts-5부_경제정치질서.mp3`,
  '6부': `${STORAGE}/narrative-tts-6부_글로벌거버넌스.mp3`,
}

function ChapterAudio({ src }: { src: string }) {
  return (
    <audio
      controls
      src={src}
      style={{
        height: 32,
        verticalAlign: 'middle',
        marginLeft: 10,
        borderRadius: 16,
        outline: 'none',
        maxWidth: 200,
      }}
    />
  )
}

const STRUCTURE = [
  { num: '1부', title: '디지털 기술의 \n특수성', sub: '기술 혁신의 유형 / 인쇄술과 디지털 / 역량 이전 / 권력 재편', color: '#dbeafe', border: '#60a5fa' },
  { num: '2부', title: '개인의 \n변화', sub: '리더·프로·아마추어·소외 / 갈망 / 불균등 강화와 격차', color: '#dcfce7', border: '#4ade80' },
  { num: '3부', title: '공동체의 \n변화', sub: '가정·이웃·마을·도시·국가·글로벌 / 위임 구조 변화 / 기존 구조와의 긴장', color: '#fef9c3', border: '#facc15' },
  { num: '4부', title: '위협의 \n지형', sub: '기술 위협의 WMD화 / 시간축별 위협 / 석학 진단과 대응', color: '#fee2e2', border: '#f87171' },
  { num: '5부', title: '경제·정치 \n질서의 변화', sub: '경제질서 한계 / 정치질서 한계 / 새로운 원리', color: '#f3e8ff', border: '#c084fc' },
  { num: '6부', title: '글로벌 \n거버넌스', sub: '세계시민 정체성 / FDA·WHO 모델 / 미중 대타협 / 연구 어젠다', color: '#ffedd5', border: '#fb923c' },
]

function StructureTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 0, minWidth: 600 }}>
        {STRUCTURE.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: s.color,
              border: `2px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 8px',
              margin: '0 4px',
              textAlign: 'center',
              position: 'relative',
            }}>
              {i > 0 && (
                <span style={{
                  position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', fontSize: 16, fontWeight: 700,
                }}>→</span>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>{s.num}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{s.title}</div>
            </div>
            <div style={{
              margin: '6px 4px 0',
              padding: '6px 8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 10,
              color: '#475569',
              lineHeight: 1.6,
            }}>
              {s.sub.split(' / ').map((t, j) => <div key={j}>· {t}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type Version = { version: string; filename: string; content: string }
const VERSIONS: Version[] = narratives as Version[]

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function getAddedParagraphs(oldContent: string, newContent: string): Set<string> {
  const oldParas = oldContent.split(/\n\n+/).map(p => normalize(p)).filter(Boolean)
  const newParas = newContent.split(/\n\n+/).map(p => normalize(p)).filter(Boolean)
  const oldSet = new Set(oldParas)
  const added = new Set<string>()
  for (const p of newParas) {
    if (!oldSet.has(p)) added.add(p)
  }
  return added
}

function toPlainText(md: string): string {
  return md
    .replace(/#+\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*]\s/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/---+/g, '')
    .trim()
}

function TtsBar({ content }: { content: string }) {
  const [playing, setPlaying] = useState(false)
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [content])

  if (!supported) return null

  const toggle = () => {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    const plain = toPlainText(content)
    const utt = new SpeechSynthesisUtterance(plain)
    utt.lang = 'ko-KR'
    utt.rate = 0.95
    utt.onend = () => setPlaying(false)
    utt.onerror = () => setPlaying(false)
    uttRef.current = utt
    window.speechSynthesis.speak(utt)
    setPlaying(true)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          border: 'none', cursor: 'pointer',
          background: playing ? '#fee2e2' : '#f0fdf4',
          color: playing ? '#dc2626' : '#16a34a',
          fontWeight: 600, fontSize: 13,
        }}
      >
        {playing ? '⏹ 읽기 중지' : '🔊 본문 읽기'}
      </button>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>브라우저 내장 TTS · 한국어</span>
    </div>
  )
}

export default function App() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showDiff, setShowDiff] = useState(false)

  const current = VERSIONS[selectedIdx]
  const previous = VERSIONS[selectedIdx + 1] ?? null

  const addedParas = useMemo(() => {
    if (!showDiff || !previous) return null
    return getAddedParagraphs(previous.content, current.content)
  }, [showDiff, selectedIdx])

  const newParaCount = current.content.split(/\n\n+/).filter(p => p.trim()).length
  const addedCount = addedParas?.size ?? 0
  const tooManyAdded = newParaCount > 0 && addedCount / newParaCount > 0.9

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Apple SD Gothic Neo', 'Pretendard', sans-serif" }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>태재디지털팀 네러티브</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>연구 내러티브 · 버전 히스토리</p>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', margin: '0 0 12px' }}>전체 구조</p>
          <StructureTable />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>버전</label>
            <select
              value={selectedIdx}
              onChange={e => { setSelectedIdx(Number(e.target.value)); setShowDiff(false) }}
              style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 0, width: '100%', cursor: 'pointer' }}
            >
              {VERSIONS.map((v, i) => (
                <option key={v.version} value={i}>
                  {i === 0 ? '★ ' : ''}{v.version} — {v.filename}
                </option>
              ))}
            </select>
          </div>

          {previous && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569', marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={showDiff}
                onChange={e => setShowDiff(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              이전 버전과 비교 ({previous.version})
            </label>
          )}
        </div>

        <TtsBar content={current.content} />

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {showDiff && addedParas && (
            tooManyAdded ? (
              <div style={{ padding: '8px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                ⚠ 두 버전의 내용이 크게 달라 비교가 어렵습니다 ({previous!.version}과 공유하는 단락이 거의 없음)
              </div>
            ) : addedCount > 0 ? (
              <div style={{ padding: '8px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a' }}>
                ★ 초록 배경 = {previous!.version} 대비 추가된 단락 ({addedCount}곳)
              </div>
            ) : (
              <div style={{ padding: '8px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
                {previous!.version} 대비 변경된 단락 없음
              </div>
            )
          )}
          <div style={{ padding: '20px 20px', lineHeight: 1.9, color: '#1e293b', textAlign: 'justify', fontFamily: "'Noto Serif KR', 'Georgia', serif", wordBreak: 'keep-all' }}>
            {current.content.split(/\n\n+/).map((para, i) => {
              const trimmed = normalize(para)
              const isNew = showDiff && addedParas && !tooManyAdded && addedParas.has(trimmed)
              return (
                <div key={i} style={{ marginBottom: 16, borderRadius: 6, background: isNew ? '#f0fdf4' : 'transparent', padding: isNew ? '4px 10px' : '0' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => {
                        const audio = CHAPTER_AUDIO['서론']
                        return (
                          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '24px 0 12px', color: '#0f172a', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <span>{children}</span>
                            {audio && <ChapterAudio src={audio} />}
                          </h1>
                        )
                      },
                      h2: ({ children }) => {
                        const text = String(children)
                        const match = text.match(/^(\d+부)/)
                        const audio = match ? CHAPTER_AUDIO[match[1]] : null
                        return (
                          <h2 style={{ fontSize: 19, fontWeight: 700, margin: '24px 0 8px', color: '#1e293b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <span>{children}</span>
                            {audio && <ChapterAudio src={audio} />}
                          </h2>
                        )
                      },
                      h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 6px', color: '#334155' }}>{children}</h3>,
                      h4: ({ children }) => <h4 style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 4px', color: '#1e293b' }}>{children}</h4>,
                      p: ({ children }) => <p style={{ marginBottom: 4, fontSize: 14 }}>{children}</p>,
                      hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />,
                      blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid #3b82f6', padding: '4px 14px', margin: '10px 0', color: '#475569', fontStyle: 'italic' }}>{children}</blockquote>,
                    }}
                  >
                    {para}
                  </ReactMarkdown>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
