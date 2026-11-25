
const db = require('../config/database');

const insertLocation = db.prepare(`
  INSERT OR IGNORE INTO locations (
    id,
    latitude,
    longitude,
    captured_at
  )
  VALUES (
    @id,
    @latitude,
    @longitude,
    @captured_at
  )
`);

const insertSyncLog = db.prepare(`
  INSERT INTO sync_logs (
    received_count,
    inserted_count,
    duplicate_count
  )
  VALUES (?, ?, ?)
`);

const getAllLocations = db.prepare(`
  SELECT
    id,
    latitude,
    longitude,
    captured_at,
    received_at
  FROM locations
  ORDER BY captured_at DESC
  LIMIT ? OFFSET ?
`);

const getLocationById = db.prepare(`
  SELECT
    id,
    latitude,
    longitude,
    captured_at,
    received_at
  FROM locations
  WHERE id = ?
`);

const getLocationCount = db.prepare(`
  SELECT COUNT(*) AS total FROM locations
`);

const saveLocationsTransaction = db.transaction((locations) => {
  let inserted = 0;
  let duplicates = 0;

  for (const location of locations) {
    const result = insertLocation.run(location);

    if (result.changes === 1) {
      inserted++;
    } else {
      duplicates++;
    }
  }

  insertSyncLog.run(
    locations.length,
    inserted,
    duplicates
  );

  return { inserted, duplicates };
});

function validateLocation(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return 'Each location must be an object.';
  }

  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    return 'Location id is required.';
  }

  if (item.id.length > 100) {
    return 'Location id must not exceed 100 characters.';
  }

  if (
    typeof item.latitude !== 'number' ||
    !Number.isFinite(item.latitude) ||
    item.latitude < -90 ||
    item.latitude > 90
  ) {
    return 'Latitude must be a number between -90 and 90.';
  }

  if (
    typeof item.longitude !== 'number' ||
    !Number.isFinite(item.longitude) ||
    item.longitude < -180 ||
    item.longitude > 180
  ) {
    return 'Longitude must be a number between -180 and 180.';
  }

  if (
    typeof item.captured_at !== 'string' ||
    Number.isNaN(Date.parse(item.captured_at))
  ) {
    return 'captured_at must be a valid date string.';
  }

  return null;
}

function normalizeLocation(item) {
  return {
    id: item.id.trim(),
    latitude: item.latitude,
    longitude: item.longitude,
    captured_at: new Date(item.captured_at).toISOString(),
  };
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

function createLocations(req, res) {
  const locations = [req.body];

  const validationError = validateLocation(locations[0]);
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const result = saveLocationsTransaction(
    locations.map(normalizeLocation)
  );

  return res.status(201).json({
    success: true,
    message: 'Location processed successfully.',
    received: 1,
    inserted: result.inserted,
    duplicates: result.duplicates,
  });
}

function createBulkLocations(req, res) {
  const locations = req.body?.locations;

  if (!Array.isArray(locations) || locations.length === 0) {
    return sendError(
      res,
      400,
      'Request must contain a non-empty locations array.'
    );
  }

  if (locations.length > 500) {
    return sendError(
      res,
      400,
      'A maximum of 500 locations is allowed per request.'
    );
  }

  for (let index = 0; index < locations.length; index++) {
    const validationError = validateLocation(locations[index]);

    if (validationError) {
      return sendError(
        res,
        400,
        `Invalid location at index ${index}: ${validationError}`
      );
    }
  }

  const normalizedLocations = locations.map(normalizeLocation);
  const result = saveLocationsTransaction(normalizedLocations);

  return res.status(201).json({
    success: true,
    message: 'Bulk synchronization completed.',
    received: locations.length,
    inserted: result.inserted,
    duplicates: result.duplicates,
  });
}

function listLocations(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
  );
  const offset = (page - 1) * limit;

  const rows = getAllLocations.all(limit, offset);
  const total = getLocationCount.get().total;

  return res.json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

function getLocation(req, res) {
  const location = getLocationById.get(req.params.id);

  if (!location) {
    return sendError(res, 404, 'Location not found.');
  }

  return res.json({
    success: true,
    data: location,
  });
}

module.exports = {
  createLocations,
  createBulkLocations,
  listLocations,
  getLocation,
};
