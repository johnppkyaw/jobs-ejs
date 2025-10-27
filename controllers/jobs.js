const Job = require('../models/Job');
const parseVErr = require("../utils/parseValidationErrs");

//GET /jobs (display all the job listings belonging to this user)
const getAllJobs = async(req, res) => {
  const jobs = await Job.find({createdBy: req.user.id}).sort('createdAt');
  res.render("jobs", { jobs })
}

//GET /jobs/new (Put up the form to create a new entry)
const loadJobForm = async(req, res) => {
  res.render("job", { job : null })
}

//POST /jobs (Add a new job listing)
const createJob = async(req, res) => {
  const { company, position, status } = req.body;
  const { id } = req.user;
  const newJob = {
    company : company,
    position: position, 
    status: status,
    createdBy : id
  }
  try {
    const job = await Job.create(newJob);
    req.flash("info", "The job listing has been added!");
    return res.redirect("/jobs");
  } catch(e) {
      if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    }
    return res.redirect("/jobs/new");
  }
}

//GET /jobs/edit/:id (Get a particular entry and show it in the edit box)
const getJob = async(req, res) => {
  const {user: {id:userId}, params: {id:jobId}} = req;
  const job = await Job.findOne({
    _id:jobId,
    createdBy: userId
  })

  if(!job) {
    req.flash("error", `No job found with ID ${jobId}!`);
    return res.redirect("/jobs");
  }

  res.render("job", { job });
}

//POST /jobs/update/:id (Update a particular entry)
const updateJob = async(req, res) => {
  const {
    user: { id: userId }, 
    params: {id:jobId},
    body: {company, position, status}
  } = req;

  try {
    const job = await Job.findByIdAndUpdate(
      {_id:jobId, createdBy: userId}, 
      req.body, 
      {new: true, runValidators: true}
    );
    req.flash("info", "The job listing has been updated successfully!");
    return res.redirect("/jobs");
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    }
    return res.redirect(`/jobs/edit/${jobId}`);
  }
}


//POST /jobs/delete/:id (Delete an entry)
const deleteJob = async(req, res) => {
  const {user: { id: userId }, params: {id: jobId}} = req;

  const job = await Job.findByIdAndDelete({
    _id:jobId,
    createdBy: userId
  })
  
  if(!job) {
    req.flash("error", `No job found with ID ${jobId}`);
    return res.redirect("/jobs");
  };

  req.flash("info", "The job listing has been deleted successfully!");
  res.redirect("/jobs");
}

module.exports = {
  loadJobForm,
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
}
