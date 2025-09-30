import mongoose from "mongoose";

const dataSchema = new mongoose.Schema({
    category: { type: String, required: true },
    paragraph: { type: String, required: true },
    audioFile: { type: String, required: true }
},
    { timestamps: true 
});

const Data = mongoose.model("Data", dataSchema);

export default Data;