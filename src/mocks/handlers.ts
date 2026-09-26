import { http, HttpResponse, delay } from 'msw'
import { summaryFixture } from './fixtures'

export const handlers = [
  http.get('/api/summary', async () => {
    await delay(250)
    return HttpResponse.json(summaryFixture)
  }),
]
