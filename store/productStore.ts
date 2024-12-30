import { create } from 'zustand'

interface ProductState {
  isUploading: boolean
  uploadError: string | null
  setUploading: (loading: boolean) => void
  setUploadError: (error: string | null) => void
  resetUploadState: () => void
}

export const useProductStore = create<ProductState>((set) => ({
  isUploading: false,
  uploadError: null,
  setUploading: (loading) => set({ isUploading: loading }),
  setUploadError: (error) => set({ uploadError: error }),
  resetUploadState: () => set({ isUploading: false, uploadError: null })
}))
