// Customers routes — all protected, require a valid JWT
const { Router } = require('express');
const { protect } = require('../middleware/auth');
const {
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateJourneyStatus,
  getJourneyEvents,
} = require('../controllers/customers.controller');

const router = Router();

// All customer routes require login
router.use(protect);

router.get('/',                          getCustomers);       // list with filters
router.get('/:id',                       getCustomerById);    // full profile
router.put('/:id',                       updateCustomer);     // edit profile fields
router.patch('/:id/journey',             updateJourneyStatus);// change journey stage
router.get('/:id/journey-events',        getJourneyEvents);   // journey history

module.exports = router;
