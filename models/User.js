import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  subject: { type: String, enum: ['physics', 'mathematics', 'chemistry', 'biology', 'computer science', 'literature', 'history', 'economics', 'environmental science', 'psychology'] },
  enrolledCourses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 }
  }],
  watchHistory: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    watchTime: Number,
    lastWatched: Date
  }],
  isSuspended: { type: Boolean, default: false },
  isGoogle: { type: Boolean, default: false },
  googleId: { type: String, default: false },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;