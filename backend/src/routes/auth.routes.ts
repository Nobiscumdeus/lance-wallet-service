

import { Router} from 'express';
import { body} from 'express-validator';
import * as authController from '../controllers/auth.controller';

const router = Router(); 

router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
          body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    ],
    authController.register 
);

router.post(
    '/login',
    [
         body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),

    ],
    authController.login
    
);

//Logout clears the HttpOnly cookie server-side 
router.post('/logout',authController.logout);

export default router ;