const express = require('express');
const router = express.Router();
const {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');
const { authenticateUser, authorizePermissions, checkVerification } = require('../middleware/auth');
const upload = require('../utils/multerConfig');

router
    .route('/')
    .post(authenticateUser, authorizePermissions('vendor', 'admin'), checkVerification, upload.array('images', 5), createVehicle)
    .get(getAllVehicles);

router
    .route('/:id')
    .get(getVehicleById)
    .patch(authenticateUser, checkVerification, upload.array('images', 5), updateVehicle)
    .delete(authenticateUser, checkVerification, deleteVehicle);

module.exports = router;
