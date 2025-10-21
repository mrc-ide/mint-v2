import { http, HttpHandler, HttpResponse } from 'msw';

// catch any missed requests in tests
const defaultHandlers = [http.all('*', () => new HttpResponse(null, { status: 200 }))];

export const handlers: HttpHandler[] = [...defaultHandlers];
