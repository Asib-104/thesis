import Data from "./data.model.js";
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const bucket_name = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const access_key = process.env.AWS_ACCESS_KEY_ID;
const secret_key = process.env.AWS_SECRET_ACCESS_KEY;

// Debug logging for environment variables
console.log('S3 Configuration:');
console.log('Bucket:', bucket_name);
console.log('Region:', region);
console.log('Access Key:', access_key ? 'Set' : 'Not set');
console.log('Secret Key:', secret_key ? 'Set' : 'Not set');

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
        
        console.log('Received upload request:');
        console.log('Category:', category);
        console.log('Paragraph length:', paragraph ? paragraph.length : 0);
        console.log('File:', file ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        } : 'No file');
        
        let uniqueFileName = null;
        
        if(file){
            // Generate unique filename for the audio file
            const fileExtension = file.originalname.split('.').pop();
            uniqueFileName = crypto.randomBytes(16).toString("hex") + "." + fileExtension;
            
            console.log('Generated filename:', uniqueFileName);
            
            const params = {
                Bucket: bucket_name,
                Key: uniqueFileName,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            
            console.log('S3 upload params:', {
                Bucket: params.Bucket,
                Key: params.Key,
                ContentType: params.ContentType,
                BodySize: params.Body.length
            });
            
            const command = new PutObjectCommand(params);
            try{
                console.log('Attempting S3 upload...');
                const data = await s3Client.send(command);
                console.log("S3 Upload Success", data.$metadata.httpStatusCode);
            }
            catch(err){
                console.error("S3 Upload Error:", err);
                console.error("Error details:", {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    statusCode: err.$metadata?.httpStatusCode
                });
                return res.status(500).json({
                    message: "Error uploading file to S3", 
                    error: err.message,
                    details: err.name
                });
            }
        }

        const newData = new Data({
            category,
            paragraph,
            audioFile: uniqueFileName
        });

        try{
            console.log('Saving to database...');
            await newData.save();
            console.log('Database save successful');
            res.status(201).json({ message: "Data saved successfully" });
        }
        catch(err){
            console.error("Error saving to DB:", err);
            res.status(500).json({ message: "Error saving data to database", error: err.message });
        }
    }catch (error) {
        console.error("General error saving data:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}; 
