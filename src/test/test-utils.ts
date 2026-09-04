export function makeVercelResponse() {
  const headers = new Map<string, string>()
  let statusCode = 0
  let body = ''

  return {
    response: {
      setHeader: (name: string, value: string) => headers.set(name, value),
      end: (value?: string) => { body = value ?? '' },
      get statusCode() { return statusCode },
      set statusCode(value: number) { statusCode = value },
    },
    get statusCode() { return statusCode },
    get body() { return body },
    headers,
  }
}
