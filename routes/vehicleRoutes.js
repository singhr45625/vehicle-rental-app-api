const express = require('express');
const router = express.Router();
const {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');
const { authenticateUser, authorizePermissions } = require('../middleware/auth');
const upload = require('../utils/multerConfig');

router
    .route('/')
    .post(authenticateUser, authorizePermissions('vendor', 'admin'), upload.array('images', 5), createVehicle)
    .get(getAllVehicles);

router
    .route('/:id')
    .get(getVehicleById)
    .patch(authenticateUser, updateVehicle)
    .delete(authenticateUser, deleteVehicle);

module.exports = router;
