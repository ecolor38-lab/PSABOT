import { Router } from 'express';
import { chatRouter } from './chat.js';
import { approvalRouter } from './approval.js';
import { contentRouter } from './content.js';
import { healthRouter } from './health.js';

const router = Router();

router.use('/chat', chatRouter);
router.use('/', approvalRouter); // /approve/:token, /reject/:token
router.use('/content', contentRouter);
router.use('/health', healthRouter);

export default router;
