const express = require('express');
const router = express.Router({ mergeParams: true });
const BudgetController = require('../controllers/BudgetController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/budget', authenticateUser, BudgetController.getBudget);
router.post('/expenses', authenticateUser, BudgetController.addExpense);
router.delete('/expenses/:expenseId', authenticateUser, BudgetController.deleteExpense);

module.exports = router;
