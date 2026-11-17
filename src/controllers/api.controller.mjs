import { createId, now } from '../models/store.mjs';
import { checkReferences, domainValidation, resourceNames, ticketValidation, validate } from '../models/validation.mjs';

const asArray = (value) => Array.isArray(value) ? value : [];
const findById = (store, resource, resourceId) => store[resource]?.find((item) => item.id === resourceId);
const send = (res, status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }); res.end(payload === undefined ? '' : JSON.stringify(payload)); };
const error = (res, status, message) => send(res, status, { error: { status, message } });

async function readBody(req) {
  let raw = ''; for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Request body must be valid JSON'); }
}

function materialize(resource, body, store) {
  const item = { id: createId(), ...body, createdAt: now(), updatedAt: now() };
  if (resource === 'events') Object.assign(item, { coverPhoto: item.coverPhoto ?? null, organizers: asArray(item.organizers), members: asArray(item.members), ticketingEnabled: Boolean(item.ticketingEnabled), shoppingListEnabled: Boolean(item.shoppingListEnabled), carpoolingEnabled: Boolean(item.carpoolingEnabled) });
  if (resource === 'groups') Object.assign(item, { icon: item.icon ?? null, coverPhoto: item.coverPhoto ?? null, members: asArray(item.members), administrators: asArray(item.administrators), allowMemberPosts: Boolean(item.allowMemberPosts), allowMemberEvents: Boolean(item.allowMemberEvents) });
  if (resource === 'tickets') Object.assign(item, { eventId: findById(store, 'ticketTypes', item.ticketTypeId).eventId, purchaseDate: item.purchaseDate ?? now() });
  return item;
}

export function createApiHandler(store, collections) {
  return async function apiHandler(req, res) {
    try {
      if (req.method === 'OPTIONS') return send(res, 204);
      const url = new URL(req.url, 'http://localhost'); const parts = url.pathname.split('/').filter(Boolean);
      if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { status: 'ok', service: 'my-social-networks-api', timestamp: now() });
      if (req.method === 'GET' && url.pathname === '/api/v1') return send(res, 200, { name: 'My Social Networks API', version: '1.0.0', documentation: '/api/v1/docs' });
      if (req.method === 'GET' && url.pathname === '/api/v1/docs') return send(res, 200, { message: 'Importez postman/My-Social-Networks-API.postman_collection.json dans Postman.', resources: collections });
      if (parts[0] !== 'api' || parts[1] !== 'v1' || !collections.includes(parts[2])) return error(res, 404, 'Route not found');

      const resource = parts[2]; const resourceId = parts[3]; const label = resourceNames[resource] ?? resource.slice(0, -1);
      if (req.method === 'GET' && !resourceId) {
        let result = [...store[resource]];
        for (const [key, value] of url.searchParams.entries()) if (!['page', 'limit'].includes(key)) result = result.filter((item) => String(item[key]) === String(value));
        const page = Math.max(Number(url.searchParams.get('page')) || 1, 1); const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100); const start = (page - 1) * limit;
        return send(res, 200, { data: result.slice(start, start + limit), pagination: { page, limit, total: result.length } });
      }
      if (req.method === 'GET' && resourceId) { const item = findById(store, resource, resourceId); return item ? send(res, 200, { data: item }) : error(res, 404, `${label} not found`); }
      if (req.method === 'POST' && !resourceId) {
        const body = await readBody(req); const validation = validate(resource, body); if (validation) return error(res, 400, validation); const references = checkReferences(store, resource, body); if (references) return error(res, 400, references); const domain = domainValidation(store, resource, body); if (domain) return error(res, 400, domain); if (resource === 'tickets') { const ticketError = ticketValidation(store, body); if (ticketError) return error(res, 409, ticketError); }
        if (resource === 'users' && store.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) return error(res, 409, 'email already exists');
        if (resource === 'shoppingItems' && store.shoppingItems.some((item) => item.eventId === body.eventId && item.name.toLowerCase() === body.name.toLowerCase())) return error(res, 409, 'this item already exists for the event');
        const item = materialize(resource, body, store); store[resource].push(item); return send(res, 201, { data: item });
      }
      if (req.method === 'PATCH' && resourceId) {
        const item = findById(store, resource, resourceId); if (!item) return error(res, 404, `${label} not found`);
        const body = await readBody(req); const merged = { ...item, ...body }; const validation = validate(resource, body, item); if (validation) return error(res, 400, validation); const references = checkReferences(store, resource, merged); if (references) return error(res, 400, references); const domain = domainValidation(store, resource, merged); if (domain) return error(res, 400, domain);
        if (resource === 'users' && body.email && store.users.some((user) => user.id !== item.id && user.email.toLowerCase() === body.email.toLowerCase())) return error(res, 409, 'email already exists');
        Object.assign(item, body, { updatedAt: now() }); return send(res, 200, { data: item });
      }
      if (req.method === 'DELETE' && resourceId) { const index = store[resource].findIndex((item) => item.id === resourceId); if (index === -1) return error(res, 404, `${label} not found`); store[resource].splice(index, 1); res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); return res.end(); }
      return error(res, 405, 'Method not allowed');
    } catch (err) { return error(res, 400, err.message); }
  };
}
