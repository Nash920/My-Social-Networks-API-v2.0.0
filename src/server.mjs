import { createServer } from 'node:http';
import { collections, createStore } from './models/store.mjs';
import { createApiHandler } from './controllers/api.controller.mjs';

export function createApp() {
  const store = createStore();
  return createServer(createApiHandler(store, collections));
}
