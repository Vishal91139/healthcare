import mongoose, { Schema } from 'mongoose';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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

userSchema.pre("save", async function(next){ 
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema);
