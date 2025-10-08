const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { userId, password } = req.body;

    if (userId === 'admin' && password === 'admin') {
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid userID or password' });
    }
});

module.exports = router;