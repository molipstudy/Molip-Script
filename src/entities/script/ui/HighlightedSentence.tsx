import { normalizeWord, parseTokenParts } from '../lib/script-text'

export function HighlightedSentence({ english, weakWords }: { english: string; weakWords: Set<string> }) {
  return english.split(/(\s+)/).map((token, index) => {
    if (/^\s+$/.test(token)) return token
    const { prefix, core, suffix } = parseTokenParts(token)
    if (!core || !weakWords.has(normalizeWord(core))) return token
    return <span className="weak-word" key={`${token}-${index}`}>{prefix}{core}{suffix}</span>
  })
}
