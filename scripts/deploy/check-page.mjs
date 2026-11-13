import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function verifyPage(expected, actual) {
  const scripts = [...expected.matchAll(/<script\b[^>]*\bsrc="(\/assets\/[^"\s]+\.js)"[^>]*>/g)].map(match => match[1])
  if (!scripts.length) throw new Error('로컬 빌드의 시작 파일을 찾지 못했습니다.')
  if (!/<div\b[^>]*\bid="root"/.test(actual) || scripts.some(src => !actual.includes(`src="${src}"`))) {
    throw new Error('배포 페이지가 검증한 빌드와 일치하지 않습니다. 운영 반영 전에 배포 상태를 확인해 주세요.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [expected, actual] = await Promise.all(process.argv.slice(2, 4).map(file => readFile(file, 'utf8')))
    verifyPage(expected, actual)
    console.log('검증한 빌드와 배포 페이지가 일치합니다.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
