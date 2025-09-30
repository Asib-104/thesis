import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import { saveData } from "./data.controller.js";

dotenv.config();

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'), false);
        }
    }
});

router.post("/save", upload.single('audioFile'), saveData);

export default router;