import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: {
      values: ['physics', 'mathematics', 'chemistry', 'biology', 'computer science', 'literature', 'history', 'economics', 'environmental science', 'psychology'],
      message: 'Subject must be one of the following: physics, mathematics, chemistry, biology, computer science, literature, history, economics, environmental science, psychology'
    },
    lowercase: true
  },
  level: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Level must be beginner, intermediate, or advanced'
    },
    required: [true, 'Level is required'],
    lowercase: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required']
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
