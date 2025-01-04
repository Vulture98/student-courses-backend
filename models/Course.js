import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    enum: {
      values: ['physics', 'mathematics', 'chemistry', 'biology', 'computer science', 'literature', 'history', 'economics', 'environmental science', 'psychology'],
      message: '{VALUE} is not a valid subject'
    },
    lowercase: true
  },
  level: {
    type: String,
    required: [true, 'Please provide a level'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    lowercase: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Please provide a video URL']
  },
  thumbnail: {
    type: String,
    required: [true, 'Please provide a thumbnail URL']
  },
  isSuspended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
