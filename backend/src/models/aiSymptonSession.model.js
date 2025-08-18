import mongoose, { Schema} from "mongoose";

const aiSymptonSessionSchema = new Schema(
    {
        sessionId: {
            type: String,
            required: true,
        },
        patientId: {
            type: String,
            required: true,
        },
        symptoms: {
            type: String,
            required: true,
        },

        ai_response: [
            {
                question: String,
                expected_answer: {
                    type: String,                 // yes_no, number, text, choice
                    unit: String,                 // for numeric answers (e.g., days, °C)
                    choices: [String],            // for choice-based answers
                    suggested_answers: [String]   // AI-predicted likely answers
                },
                user_response: {
                value: String,       // what user answered (tap or typed)
                source: String,      // "tap" or "typed"
                timestamp: Date,
                notes: String
                }
            }
        ],

        diagnosis: [
            { name: String, confidence: Number }
        ],

        recommended_action: String,
        notes: String,
        status: {
            type: String,
            enum: ["in-progress", "completed"],
            default: "in-progress",
        },
    },
    { timestamps: true }
);

export const aiSymptonSession = mongoose.model("aiSymptonSession", aiSymptonSessionSchema);
