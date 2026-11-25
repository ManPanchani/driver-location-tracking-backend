
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

describe('Driver Location Tracking API Tests', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM sync_logs').run();
    db.prepare('DELETE FROM locations').run();
  });

  afterAll(() => {
    db.close();
  });

  const sampleLocation = {
    id: 'test-location-001',
    latitude: 21.1702,
    longitude: 72.8311,
    captured_at: '2026-11-24T10:30:00.000Z',
  };

  test('GET /api/v1/health should return healthy status', async () => {
    const response = await request(app)
      .get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.database).toBe('connected');
  });

  test('POST /api/v1/locations should save a location', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .send(sampleLocation);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.inserted).toBe(1);
    expect(response.body.duplicates).toBe(0);
  });

  test('Duplicate location should not be inserted twice', async () => {
    await request(app)
      .post('/api/v1/locations')
      .send(sampleLocation);

    const response = await request(app)
      .post('/api/v1/locations')
      .send(sampleLocation);

    expect(response.status).toBe(201);
    expect(response.body.inserted).toBe(0);
    expect(response.body.duplicates).toBe(1);

    const count = db.prepare(
      'SELECT COUNT(*) AS total FROM locations WHERE id = ?'
    ).get(sampleLocation.id);

    expect(count.total).toBe(1);
  });

  test('POST /api/v1/locations/bulk should save multiple locations', async () => {
    const locations = [
      sampleLocation,
      {
        id: 'test-location-002',
        latitude: 21.1710,
        longitude: 72.8320,
        captured_at: '2026-11-24T10:35:00.000Z',
      },
    ];

    const response = await request(app)
      .post('/api/v1/locations/bulk')
      .send({ locations });

    expect(response.status).toBe(201);
    expect(response.body.received).toBe(2);
    expect(response.body.inserted).toBe(2);
    expect(response.body.duplicates).toBe(0);
  });

  test('Invalid latitude should return 400', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .send({
        ...sampleLocation,
        latitude: 100,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('Empty bulk locations should return 400', async () => {
    const response = await request(app)
      .post('/api/v1/locations/bulk')
      .send({ locations: [] });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/v1/locations should return saved locations', async () => {
    await request(app)
      .post('/api/v1/locations')
      .send(sampleLocation);

    const response = await request(app)
      .get('/api/v1/locations');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(sampleLocation.id);
  });

  test('GET location by ID should return 404 when not found', async () => {
    const response = await request(app)
      .get('/api/v1/locations/unknown-location');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
