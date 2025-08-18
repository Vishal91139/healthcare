import mongoose, { Schema } from 'mongoose';

const patientDocumentsSchema = new Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        documentType: {
            type: String,
            enum: ["xray", "ct", "mri", "prescription", "lab-report", "other"],
            required: true
        },
        fileUrl: {
            type: String,      // Cloudinary or aws s3 url
            required: true,
        },
        analyzedByAI: {
            type: Boolean,
            default: false,
        },  
        aiAnalysisResult: {
            type: String,
        },
    },
    { timestamps: true }
);

export const PatientDocuments = mongoose.model('PatientDocuments', patientDocumentsSchema);

