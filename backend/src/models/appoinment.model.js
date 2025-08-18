import mongoose, { Schema } from 'mongoose';

const appoinmentSchema = new Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        triage_session_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'aiSymptonSession',
            required: true
        },
        type: {
            type: String,
            enum: ["in-person", "virtual"],
            required: true
        },
        status: {
            type: String, 
            enum: ["scheduled", "completed", "cancelled"] 
        },
        scheduledAt: { 
            type: Date, 
            required: true 
        }
    },
    { timestamps: true }
);

export const Appoinment = mongoose.model('Appoinment', appoinmentSchema);

