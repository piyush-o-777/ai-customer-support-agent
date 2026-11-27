import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';
import { chatRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authMiddleware);

router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.listConversations);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatRateLimiter, chatController.sendMessage);
router.delete('/conversations/:id', chatController.deleteConversation);

export default router;
