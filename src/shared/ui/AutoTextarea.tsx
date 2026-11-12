import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { ComponentProps } from 'react'

function fit(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  const borders = element.offsetHeight - element.clientHeight
  element.style.height = `${element.scrollHeight + borders}px`
}

export function AutoTextarea({ ref, value, ...props }: ComponentProps<'textarea'>) {
  const element = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => element.current!, [])
  useLayoutEffect(() => { if (element.current) fit(element.current) }, [value])
  useLayoutEffect(() => {
    const node = element.current
    if (!node) return
    let width = -1
    const observer = new ResizeObserver(() => {
      if (node.clientWidth === width) return
      width = node.clientWidth
      fit(node)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <textarea {...props} ref={element} value={value} style={{ ...props.style, resize: 'none', overflowY: 'hidden' }} />
}
