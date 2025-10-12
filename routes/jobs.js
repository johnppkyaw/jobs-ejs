const express = require('express');
const router = express.Router();

const {
  loadJobForm,
  getAllJobs, 
  getJob, 
  createJob, 
  updateJob, 
  deleteJob
} = require('../controllers/jobs');

router.route('/').post(createJob).get(getAllJobs);
router.route('/new').get(loadJobForm)
router.route('/edit/:id').get(getJob);
router.route('/update/:id').post(updateJob);
router.route('/delete/:id').post(deleteJob);

module.exports = router;
