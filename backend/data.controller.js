import Data from "./data.model.js";
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import multer from 'multer';

dotenv.config();

const bucket_name = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const access_key = process.env.AWS_ACCESS_KEY_ID;
const secret_key = process.env.AWS_SECRET_ACCESS_KEY;

export const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: access_key,
        secretAccessKey: secret_key
    }
});

export const saveData = async (req, res) => {
    try{
        const {category, paragraph} = req.body;
        const file = req.file;
        
        let uniqueFileName = null;
        
        if(file){
            // Generate unique filename for the audio file
            const fileExtension = file.originalname.split('.').pop();
            uniqueFileName = crypto.randomBytes(16).toString("hex") + "." + fileExtension;
            
            const params = {
                Bucket: bucket_name,
                Key: uniqueFileName,
                Body: file.buffer,
                ContentType: req.file.mimetype
            };
            const command = new PutObjectCommand(params);
            try{
                const data = await s3Client.send(command);
                console.log("Success", data.$metadata.httpStatusCode);
            }
            catch(err){
                console.log("Error", err);
                return res.status(500).json({message: "Error uploading file to S3", error: err});
            }
        }

        const newData = new Data({
            category,
            paragraph,
            audioFile: uniqueFileName
        });

        try{
            await newData.save();
            res.status(201).json({ message: "Data saved successfully" });
        }
        catch(err){
            console.error("Error saving to DB:", err);
            res.status(500).json({ message: "Error saving data to database", error: err });
        }
    }catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ message: "Server error" });
    }
}; 
