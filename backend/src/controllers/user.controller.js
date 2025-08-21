import crypto from "crypto"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandle.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh token and access token")
    }
}

const generateUserId = async(role) => {
    try {
        function randBase36(length = 5) {
            return crypto.randomBytes(4).toString('base64url')  
            .replace(/[^A-Za-z0-9]/g, '').slice(0, length).toUpperCase();
        }

        function yymmdd(date = new Date()) {
            const y = String(date.getFullYear()).slice(-2);
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}${m}${d}`;
        }

        if(role === "patient") {
            return `PAT-${yymmdd()}-${randBase36(5)}`
        } else if(role === "doctor") {
            return `DOC-${yymmdd()}-${randBase36(5)}`
        }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating user id")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const {role, fullname, dob, gender, email, phone, password, patientProfile, doctorProfile} = req.body

    if(
        [role, fullname, dob, gender, email, phone, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{email}, {phone}]
    })

    if(existingUser) {
        throw new ApiError(409, "User with email or phone already exists")
    }

    if(role === "patient"){
        const userId = await generateUserId(role)
        patientProfile.patientId = userId
    }
    if(role === "doctor"){
        const userId = await generateUserId(role)
        doctorProfile.doctorId = userId
    }

    const user = await User.create({
        role,
        fullname,
        dob,
        gender,
        email,
        phone,
        password,
        ...(role === 'patientProfile' && {patientProfile}),
        ...(role === 'doctorProfile' && {doctorProfile})
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201).json( 
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {

    const {email, password} = req.body

    if(!email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({email})

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "passsword changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAcoountDetails = asyncHandler(async (req, res) => {

    const {fullname, dob, gender, email, phone, patientProfile, doctorProfile} = req.body

    if(
        [fullname, dob, gender, email, phone].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const userRole = req.user?.role

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                dob,
                gender,
                email,
                phone,
                ...(userRole === "patient" && patientProfile ? {patientProfile} : {}),
                ...(userRole === "doctor" && doctorProfile ? {doctorProfile} : {})
            }
        },
        {
            new: true,
            runValidators: true
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details update successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAcoountDetails
}