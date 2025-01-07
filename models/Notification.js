import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['COURSE_ASSIGNED', 'COURSE_REMOVED', 'SYSTEM'],
    default: 'SYSTEM'
  },
  data: {
    courses: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      description: String,
      subject: String,
      level: String
    }]
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);
