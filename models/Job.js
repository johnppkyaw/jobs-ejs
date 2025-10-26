const mongoose = require('mongoose');
const JobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Please provide a company name'],
    maxlength: 50
  },
  position: {
    type: String,
    required: [true, 'Please provide a position'],
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['interview', 'declined', 'pending'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user']
  }
}, {timestamps: true})

//timestamps option manages createdAt and updatedAt in the model.


module.exports = mongoose.model('Job', JobSchema);
