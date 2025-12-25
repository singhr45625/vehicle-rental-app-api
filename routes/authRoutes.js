const express = require('express');
const router = express.Router();
const { register, login, deleteUser, searchUser, updateUser } = require('../controllers/authController');
const upload = require('../utils/multerConfig');

router.post('/register', upload.fields([
    { name: 'adhaarCard', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'universityId', maxCount: 1 },
    { name: 'shopPaper', maxCount: 1 }
]), register);
router.post('/login', login);
router.delete('/delete/:userId', deleteUser);
router.get('/search', searchUser);
router.put('/update/:userId', updateUser);

module.exports = router;