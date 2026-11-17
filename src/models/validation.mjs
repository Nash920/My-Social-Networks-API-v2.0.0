export const resourceNames = { ticketTypes: 'ticket type', shoppingItems: 'shopping item' };
const required = (body, fields) => fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
const findById = (store, resource, resourceId) => store[resource]?.find((item) => item.id === resourceId);

export function validate(resource, body, current = {}) {
  const requiredFields = { users: ['firstName', 'lastName', 'email'], events: ['name', 'description', 'startDate', 'endDate', 'location', 'visibility'], groups: ['name', 'description', 'type'], discussions: ['name'], messages: ['content', 'authorId'], albums: ['eventId', 'name'], photos: ['albumId', 'url', 'authorId'], polls: ['eventId', 'createdBy', 'title', 'questions'], ticketTypes: ['eventId', 'name', 'amount', 'quantity'], tickets: ['ticketTypeId', 'firstName', 'lastName', 'email', 'address'], shoppingItems: ['eventId', 'name', 'quantity', 'arrivalTime'], carpools: ['eventId', 'departureLocation', 'departureTime', 'price', 'availableSeats', 'maximumDelayMinutes'] };
  const merged = { ...current, ...body }; const missing = required(merged, requiredFields[resource] ?? []);
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (resource === 'users' && !/^\S+@\S+\.\S+$/.test(merged.email)) return 'email is invalid';
  if (resource === 'events') { if (!['public', 'private'].includes(merged.visibility)) return 'visibility must be public or private'; const start = new Date(merged.startDate); const end = new Date(merged.endDate); if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end <= start) return 'endDate must be after startDate'; }
  if (resource === 'groups' && !['public', 'private', 'secret'].includes(merged.type)) return 'type must be public, private or secret';
  if (resource === 'polls' && (!Array.isArray(merged.questions) || merged.questions.length === 0)) return 'a poll must contain at least one question';
  for (const field of ['amount', 'quantity', 'price', 'availableSeats', 'maximumDelayMinutes']) if (merged[field] !== undefined && (typeof merged[field] !== 'number' || merged[field] < 0)) return `${field} must be a positive number`;
  return null;
}

export function checkReferences(store, resource, body) {
  const refs = { events: [['organizers', 'users'], ['members', 'users']], groups: [['members', 'users'], ['administrators', 'users']], discussions: [['groupId', 'groups'], ['eventId', 'events']], albums: [['eventId', 'events']], photos: [['albumId', 'albums'], ['authorId', 'users']], messages: [['discussionId', 'discussions'], ['authorId', 'users']], polls: [['eventId', 'events'], ['createdBy', 'users']], ticketTypes: [['eventId', 'events']], tickets: [['ticketTypeId', 'ticketTypes']], shoppingItems: [['eventId', 'events']], carpools: [['eventId', 'events']] }[resource] ?? [];
  for (const [field, target] of refs) { const value = body[field]; if (Array.isArray(value)) { if (value.some((reference) => !findById(store, target, reference))) return `${field} references an unknown ${target.slice(0, -1)}`; } else if (value && !findById(store, target, value)) return `${field} references an unknown ${target.slice(0, -1)}`; }
  return null;
}

export function domainValidation(store, resource, body) {
  if (resource === 'events' && (!Array.isArray(body.organizers) || body.organizers.length === 0 || !Array.isArray(body.members))) return 'an event must have at least one organizer and a members list';
  if (resource === 'groups' && (!Array.isArray(body.members) || body.members.length === 0 || !Array.isArray(body.administrators) || body.administrators.length === 0)) return 'a group must have at least one member and one administrator';
  if (resource === 'discussions' && Boolean(body.groupId) === Boolean(body.eventId)) return 'a discussion must be linked to exactly one group or event';
  if (resource === 'polls') for (const question of body.questions) if (!question || typeof question !== 'object' || typeof question.label !== 'string' || !Array.isArray(question.options) || question.options.length < 2) return 'each poll question must have a label and at least two options';
  const eventFor = (eventId) => findById(store, 'events', eventId);
  if (resource === 'ticketTypes') { const event = eventFor(body.eventId); if (event && event.visibility !== 'public') return 'ticketing is available only for public events'; }
  if (resource === 'shoppingItems') { const event = eventFor(body.eventId); if (event && event.shoppingListEnabled !== true) return 'shopping list is disabled for this event'; }
  if (resource === 'carpools') { const event = eventFor(body.eventId); if (event && event.carpoolingEnabled !== true) return 'carpooling is disabled for this event'; }
  if (resource === 'photos') { const album = findById(store, 'albums', body.albumId); const event = album && eventFor(album.eventId); if (event && !event.members.includes(body.authorId)) return 'only an event member can post a photo'; }
  if (resource === 'polls') { const event = eventFor(body.eventId); if (event && !event.organizers.includes(body.createdBy)) return 'only an event organizer can create a poll'; }
  return null;
}

export function ticketValidation(store, body) {
  const type = findById(store, 'ticketTypes', body.ticketTypeId); const event = type && findById(store, 'events', type.eventId); if (!type || !event) return null;
  if (store.tickets.filter((ticket) => ticket.ticketTypeId === type.id).length >= type.quantity) return 'this ticket type is sold out';
  if (store.tickets.some((ticket) => ticket.email.toLowerCase() === body.email.toLowerCase() && ticket.eventId === event.id)) return 'a person can obtain only one ticket per event';
  return null;
}
