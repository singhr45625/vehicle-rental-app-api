const express = require('express');
const router = express.Router();
const { register, login, deleteUser, searchUser, updateUser, getProfile, updateProfile, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/multerConfig');

router.post('/register', upload.fields([
    { name: 'adhaarCard', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'universityId', maxCount: 1 },
    { name: 'shopPaper', maxCount: 1 }
]), register);
router.post('/login', login);
router.post('/google', googleLogin);
router.delete('/delete/:userId', deleteUser);
router.get('/search', searchUser);
router.put('/update/:userId', updateUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.fields([
    { name: 'adhaarCard', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'universityId', maxCount: 1 },
    { name: 'shopPaper', maxCount: 1 }
]), updateProfile);

module.exports = router;