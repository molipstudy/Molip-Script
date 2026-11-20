import { useId } from 'react'
import { number } from '../model/member'
export type ChartSeries = { label: string; color: string; values: number[] }
export function MetricsChart({ title, timestamps, series, hourly = false }: { title: string; timestamps: string[]; series: ChartSeries[]; hourly?: boolean }) {
 const id = useId()
 if (!timestamps.length) return <p className="admin-empty">아직 집계된 기록이 없어요</p>
 const max = Math.max(1, ...series.flatMap(item => item.values))
 const top = Math.ceil(max / 4) * 4
 const start = Date.parse(timestamps[0]), end = Date.parse(timestamps[timestamps.length - 1])
 const x = (index: number) => timestamps.length === 1 ? 348 : 48 + (Date.parse(timestamps[index]) - start) * 600 / Math.max(1, end - start)
 const y = (value: number) => 210 - value / top * 178
 const label = (timestamp: string) => new Date(timestamp).toLocaleString('ko-KR', { timeZone: 'UTC', ...(hourly ? { hour: 'numeric', hour12: false } : { month: 'numeric', day: 'numeric' }) })
 return <div className="metrics-chart">
  <div className="metrics-legend">{series.map(item => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}<small>UTC 기준</small></div>
  <svg viewBox="0 0 680 252" role="img" aria-labelledby={`${id}-title ${id}-desc`}><title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>시간에 따른 {series.map(item => item.label).join(', ')} 추이. 아래 데이터 표에서 정확한 수치를 확인할 수 있어요.</desc>
   {[0, 1, 2, 3, 4].map(step => <g key={step}><line x1="48" x2="648" y1={y(top * step / 4)} y2={y(top * step / 4)} stroke="#eeeaf5" /><text x="40" y={y(top * step / 4) + 4} textAnchor="end">{number(top * step / 4)}</text></g>)}
   {series.map(item => <g key={item.label}><polyline points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinejoin="round" />{item.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="4" fill={item.color} tabIndex={0} aria-label={`${label(timestamps[index])} ${item.label} ${number(value)}`}><title>{label(timestamps[index])} · {item.label} {number(value)}</title></circle>)}</g>)}
   {timestamps.map((timestamp, index) => index === 0 || index === timestamps.length - 1 || index % Math.ceil(timestamps.length / 5) === 0 ? <text key={timestamp} x={x(index)} y="238" textAnchor="middle">{label(timestamp)}</text> : null)}
  </svg>
  <details className="metrics-data"><summary>데이터 표 보기</summary><div className="admin-table-scroll"><table><thead><tr><th>일시 (UTC)</th>{series.map(item => <th key={item.label}>{item.label}</th>)}</tr></thead><tbody>{timestamps.map((timestamp, index) => <tr key={timestamp}><th scope="row">{new Date(timestamp).toLocaleString('ko-KR', { timeZone: 'UTC' })}</th>{series.map(item => <td key={item.label}>{number(item.values[index])}</td>)}</tr>)}</tbody></table></div></details>
 </div>
}
