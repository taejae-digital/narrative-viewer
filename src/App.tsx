import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import narratives from './narratives.json'

type Version = { version: string; filename: string; content: string }
const VERSIONS: Version[] = narratives as Version[]

function computeDiff(oldLines: string[], newLines: string[]) {
  type Chunk = { t: 'same' | 'add' | 'del'; l: string }
  const result: Chunk[] = []
  let i = 0, j = 0
  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) { result.push({ t: 'add', l: newLines[j++] }); continue }
    if (j >= newLines.length) { result.push({ t: 'del', l: oldLines[i++] }); continue }
    if (oldLines[i] === newLines[j]) { result.push({ t: 'same', l: oldLines[i] }); i++; j++; continue }
    let fa = -1, fb = -1
    outer: for (let d = 1; d <= 8; d++)
      for (let ai = i; ai < Math.min(i + d, oldLines.length); ai++)
        for (let bj = j; bj < Math.min(j + d, newLines.length); bj++)
          if (oldLines[ai] === newLines[bj]) { fa = ai; fb = bj; break outer }
    if (fa === -1) { result.push({ t: 'del', l: oldLines[i++] }); result.push({ t: 'add', l: newLines[j++] }) }
    else { while (i < fa) result.push({ t: 'del', l: oldLines[i++] }); while (j < fb) result.push({ t: 'add', l: newLines[j++] }) }
  }
  return result
}

export default function App() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showDiff, setShowDiff] = useState(false)

  const current = VERSIONS[selectedIdx]
  const previous = VERSIONS[selectedIdx + 1] ?? null

  const diff = useMemo(() => {
    if (!showDiff || !previous) return null
    return computeDiff(previous.content.split('\n'), current.content.split('\n'))
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
          {showDiff && diff ? (
            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
              <div style={{ padding: '10px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 24, fontSize: 12 }}>
                <span style={{ color: '#ef4444' }}>■ 삭제</span>
                <span style={{ color: '#22c55e' }}>■ 추가</span>
                <span style={{ color: '#94a3b8' }}>{previous!.version} → {current.version}</span>
              </div>
              {diff.map((chunk, i) => (
                <div key={i} style={{
                  padding: '2px 20px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  background: chunk.t === 'add' ? '#f0fdf4' : chunk.t === 'del' ? '#fef2f2' : '#fff',
                  color: chunk.t === 'add' ? '#16a34a' : chunk.t === 'del' ? '#dc2626' : '#94a3b8',
                  borderLeft: chunk.t === 'add' ? '3px solid #22c55e' : chunk.t === 'del' ? '3px solid #ef4444' : 'none',
                }}>
                  {chunk.t === 'add' ? '+ ' : chunk.t === 'del' ? '- ' : '  '}{chunk.l}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px 20px', lineHeight: 1.9, color: '#1e293b' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 style={{ fontSize: 24, fontWeight: 700, margin: '24px 0 12px', color: '#0f172a' }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: 19, fontWeight: 700, margin: '24px 0 8px', color: '#1e293b' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 6px', color: '#334155' }}>{children}</h3>,
                  p: ({ children }) => <p style={{ marginBottom: 12, fontSize: 15 }}>{children}</p>,
                  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />,
                  blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid #3b82f6', padding: '4px 14px', margin: '10px 0', color: '#475569', fontStyle: 'italic' }}>{children}</blockquote>,
                }}
              >
                {current.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
