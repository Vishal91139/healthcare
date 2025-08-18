import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
    {
        role: {
            type: String,
            enum: ['admin', 'patient', 'doctor'],
            default: 'patient',
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        dob: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String
        },

        // if role is patient
        patientProfile: {
            patientId: {
                type: String,
                required: true,
                unique: true,
            },
            address: {
                type: String
            },
            bloodGroup: {
                type: String
            },
            allergies: {
                type: String
            },
            chronicDiseases: {
                type: String
            },
            emergencyContact: {
                type: String
            },
        },
        
        // if role is doctor
        doctorProfile: {
            doctorId: {
                type: String,
                required: true,
                unique: true,
            },
            specialization: {
                type: String,
                required: true,
            },
            licenseNumber: {
                type: String,
                required: true,
            },
            yearsOfExperience: {
                type: String
            },
            availability: {
                type: String
            }
        }
    },
    { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
