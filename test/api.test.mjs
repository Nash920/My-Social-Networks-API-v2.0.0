import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.mjs';

let server;
let baseUrl;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test('health endpoint returns the API status', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('users can be listed and created', async () => {
  const initial = await fetch(`${baseUrl}/api/v1/users`);
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).pagination.total, 1);

  const created = await fetch(`${baseUrl}/api/v1/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: 'Bob', lastName: 'Dupont', email: 'bob@example.com' })
  });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).data.email, 'bob@example.com');
});

test('duplicate emails are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/v1/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: 'Alice', lastName: 'Other', email: 'alice@example.com' })
  });
  assert.equal(response.status, 409);
});

test('events validate their date order', async () => {
  const response = await fetch(`${baseUrl}/api/v1/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Bad event', description: 'Invalid', startDate: '2027-06-11T18:00:00Z', endDate: '2027-06-10T18:00:00Z', location: 'Paris', visibility: 'public' })
  });
  assert.equal(response.status, 400);
});

test('discussions cannot belong to both a group and an event', async () => {
  const user = (await (await fetch(`${baseUrl}/api/v1/users`)).json()).data[0];
  const group = await fetch(`${baseUrl}/api/v1/groups`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Test group', description: 'Test', type: 'public', members: [user.id], administrators: [user.id] })
  });
  const groupId = (await group.json()).data.id;
  const event = (await (await fetch(`${baseUrl}/api/v1/events`)).json()).data[0];
  const response = await fetch(`${baseUrl}/api/v1/discussions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Invalid discussion', groupId, eventId: event.id })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error.message, /exactly one group or event/);
});

test('polls require structured questions with multiple choices', async () => {
  const event = (await (await fetch(`${baseUrl}/api/v1/events`)).json()).data[0];
  const user = (await (await fetch(`${baseUrl}/api/v1/users`)).json()).data[0];
  const response = await fetch(`${baseUrl}/api/v1/polls`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventId: event.id, createdBy: user.id, title: 'Invalid poll', questions: [{ label: 'Only one', options: ['A'] }] })
  });
  assert.equal(response.status, 400);
});

test('ticket types are restricted to public events', async () => {
  const user = (await (await fetch(`${baseUrl}/api/v1/users`)).json()).data[0];
  const eventResponse = await fetch(`${baseUrl}/api/v1/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Private event', description: 'Private', startDate: '2027-06-11T18:00:00Z', endDate: '2027-06-11T20:00:00Z', location: 'Paris', visibility: 'private', organizers: [user.id], members: [user.id] })
  });
  const event = (await eventResponse.json()).data;
  const response = await fetch(`${baseUrl}/api/v1/ticketTypes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventId: event.id, name: 'Private ticket', amount: 10, quantity: 1 })
  });
  assert.equal(response.status, 400);
});
