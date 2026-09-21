declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    scale?: number
    backgroundColor?: string | null
    useCORS?: boolean
    logging?: boolean
    width?: number
    height?: number
    windowWidth?: number
    windowHeight?: number
    onclone?: (doc: Document) => void
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions,
  ): Promise<HTMLCanvasElement>
}