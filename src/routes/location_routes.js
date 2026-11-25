
const express = require('express');

const {
  createLocations,
  createBulkLocations,
  listLocations,
  getLocation,
} = require('../controllers/location_controller');

const router = express.Router();

router.post('/', createLocations);
router.post('/bulk', createBulkLocations);
router.get('/', listLocations);
router.get('/:id', getLocation);

module.exports = router;
