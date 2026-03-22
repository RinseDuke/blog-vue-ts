import { useCoverUpload } from '@/features/post/composables/useCoverUpload'

class FileReaderMock {
  result: string | ArrayBuffer | null = null
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null

  readAsDataURL(file: Blob) {
    this.result = `data:${file.type};base64,Y292ZXI=`
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }
}

describe('useCoverUpload', () => {
  beforeEach(() => {
    vi.stubGlobal('FileReader', FileReaderMock as unknown as typeof FileReader)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores cover previews as stable data urls', async () => {
    const onDirty = vi.fn()
    const { coverPreviewUrl, handleCoverSelect, restoreCoverFromUrl } = useCoverUpload(onDirty)
    const input = {
      files: [new File(['cover'], 'cover.png', { type: 'image/png' })],
      value: 'cover.png',
    } as unknown as HTMLInputElement

    await expect(handleCoverSelect({ target: input } as unknown as Event)).resolves.toBeNull()

    expect(coverPreviewUrl.value).toBe('data:image/png;base64,Y292ZXI=')
    expect(input.value).toBe('')
    expect(onDirty).toHaveBeenCalledTimes(1)

    restoreCoverFromUrl('blob:legacy-cover')
    expect(coverPreviewUrl.value).toBeNull()

    restoreCoverFromUrl('https://example.com/cover.png')
    expect(coverPreviewUrl.value).toBe('https://example.com/cover.png')
  })

  it('rejects unsupported image types without mutating state', async () => {
    const onDirty = vi.fn()
    const { coverPreviewUrl, handleCoverSelect } = useCoverUpload(onDirty)
    const input = {
      files: [new File(['cover'], 'cover.gif', { type: 'image/gif' })],
      value: 'cover.gif',
    } as unknown as HTMLInputElement

    await expect(handleCoverSelect({ target: input } as unknown as Event)).resolves.toBe('仅支持 JPEG、JPG、PNG 格式图片')

    expect(coverPreviewUrl.value).toBeNull()
    expect(input.value).toBe('')
    expect(onDirty).not.toHaveBeenCalled()
  })
})
