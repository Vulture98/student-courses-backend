import express from "express";
import getGoogleUser from "../controllers/googleController.js";

const router = express.Router();

router.post("/", getGoogleUser);

export { router as googleRouter };
