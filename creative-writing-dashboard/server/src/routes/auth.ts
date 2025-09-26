import express from 'express';
import { login, register, logout } from '../controllers/authController';

const router = express.Router();

// User registration route
router.post('/register', register);

// User login route
router.post('/login', login);

// User logout route
router.post('/logout', logout);

export default router;