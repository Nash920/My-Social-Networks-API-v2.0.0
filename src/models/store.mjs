import { randomUUID } from 'node:crypto';

export const collections = ['users', 'events', 'groups', 'discussions', 'messages', 'albums', 'photos', 'polls', 'ticketTypes', 'tickets', 'shoppingItems', 'carpools'];
export const now = () => new Date().toISOString();
export const createId = () => randomUUID();

export function createStore() {
  const data = Object.fromEntries(collections.map((name) => [name, []]));
  const userId = createId();
  data.users.push({ id: userId, firstName: 'Alice', lastName: 'Martin', email: 'alice@example.com', city: 'Paris', createdAt: now() });
  data.events.push({ id: createId(), name: 'Afterwork Data Engineering', description: 'Rencontre entre étudiants et professionnels de la data.', startDate: '2027-06-10T18:00:00.000Z', endDate: '2027-06-10T22:00:00.000Z', location: 'Paris', coverPhoto: null, visibility: 'public', organizers: [userId], members: [userId], ticketingEnabled: false, shoppingListEnabled: true, carpoolingEnabled: false, createdAt: now(), updatedAt: now() });
  return data;
}
