import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiResponse from './utils/apiResponse.js';
import connectDB from './config/db.js';
import { authRouter } from './routes/auth.js';
import { courseRouter } from './routes/courses.js';
import { adminRouter } from './routes/admin.js';
import { studentRouter } from './routes/student.js';
import { googleRouter } from './routes/googleRoutes.js';

dotenv.config();
const PORT = process.env.PORT || 5000;
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true
// }));
const allowedOrigins = [
  "https://student-courses-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // console.log('Request from origin:', origin);
      // Allow requests with no origin
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        // console.log('Origin allowed:', origin);
        callback(null, true);
      } else {
        // console.log('Origin blocked:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],  // for cookie handling
  })
);

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);
app.use("/auth/google", googleRouter);





app.get("/", (req, res) => {
  res.send("Hello Welcome to Courses API");
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // console.log(`inside global err() `);
  // console.log(`inside global err(): ${err} `);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json(
    apiResponse(
      false,
      err.statusCode,
      null,
      null,
      err.message,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));