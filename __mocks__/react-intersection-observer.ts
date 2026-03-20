/**
 * Manual mock for react-intersection-observer.
 * Exported as vi.fn() so individual tests can override return values
 * via vi.mocked(useInView).mockReturnValueOnce(...).
 * Defaults to inView: true so components render their visible state.
 */
import { vi } from 'vitest'

export const useInView = vi.fn(() => ({
  ref: vi.fn(),
  inView: true,
  entry: undefined,
}))
