import { Router} from 'express'
import { body} from 'express-validator'
import * as authController from '../controllers/auth.controller'

const router = Router();

// POST /auth/register 
router.post(
    '/register',
    [
        //Name must be a non-empty string 
        body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),

        //Email must be valid format 
        body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(), //lowercases and cleans the email

        //Password minimum 8 characters
        body('password')
        .isLength({ min:8})
        .withMessage('Password must be at least 8 characters'),

    ],
    authController.register
); 

//POST /auth/login 
router.post(
    '/login',
    [
        body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

        body('password')
        .notEmpty()
        .withMessage('Password is required'),
    ],
    authController.login
); 

export default router;