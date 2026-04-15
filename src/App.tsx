import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import narratives from './narratives.json'

type Version = { version: string; filename: string; content: string }
const VERSIONS: Version[] = narratives as Version[]

function getAddedParagraphs(oldContent: string, newContent: string): Set<string> {
  const oldParas = new Set(oldContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean))
  const added = new Set<string>()
  for (const p of newContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean)) {
    if (!oldParas.has(p)) added.add(p)
  }
  return added
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Apple SD Gothic Neo', 'Pretendard', sans-serif" }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>태재디지털팀 네러티브</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 32 }}>개인의 시대 · 버전 히스토리</p>

        {/* Controls */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 20, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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

        {/* Content */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {showDiff && addedParas && addedParas.size > 0 && (
            <div style={{ padding: '8px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a' }}>
              ★ 초록 배경 = {previous!.version} 대비 추가된 단락 ({addedParas.size}곳)
            </div>
          )}
          (
            <div style={{ padding: '20px 20px', lineHeight: 1.9, color: '#1e293b' }}>
              {current.content.split(/\n\n+/).map((para, i) => {
                const trimmed = para.trim()
                const isNew = showDiff && addedParas && addedParas.has(trimmed)
                return (
                  <div key={i} style={{ marginBottom: 16, borderRadius: 6, background: isNew ? '#f0fdf4' : 'transparent', padding: isNew ? '4px 10px' : '0' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 style={{ fontSize: 24, fontWeight: 700, margin: '24px 0 12px', color: '#0f172a' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: 19, fontWeight: 700, margin: '24px 0 8px', color: '#1e293b' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 6px', color: '#334155' }}>{children}</h3>,
                        p: ({ children }) => <p style={{ marginBottom: 4, fontSize: 15 }}>{children}</p>,
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
          )
        </div>
      </div>
    </div>
  )
}
