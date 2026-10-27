import { Router } from "express";
import * as authService from "./auth.service.js";
import  * as validators from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import { BadRequestException } from "../../Utils/Errors/exception.error.js";
import { authenticate } from "../../Middlewares/authentication.middleware.js";
import { decodeRefreshToken } from "../../Middlewares/decodeRefreshToken.middleware.js";
const authController = Router();



authController.post("/register",validation(validators.signup) , async (req, res) => {
  const { firstName, lastName, email, password , gender , age , phone } = req.body;
  const result = await authService.registerUser(req.validate.body,{ firstName, lastName, email, password , gender , age , phone });
    res.status(200).json({ status: "User registered successfully" , data: result });
});




authController.post("/login",validation(validators.login) , async (req, res) => {
  const { email, password } = req.body;
    const result = await authService.login(req.validate.body,{ email, password });
    res.status(200).json({ status: "User logged in successfully", data: result });
});


authController.post("/google-register", async (req, res) => {
const {idToken} = req.body;
if (!idToken) {
  throw new BadRequestException("Google ID token is required" , null , 'MISSING_GOOGLE_ID_TOKEN');
}
  const result = await authService.googleRegister(idToken);
  res.status(201).json({ status: "User registered successfully", data: result });

});



authController.post("/google-login", async (req, res) => {
  const {idToken} = req.body;
  if (!idToken) {
    throw new BadRequestException("Google ID token is required" , null , 'MISSING_GOOGLE_ID_TOKEN');
  }
  const result = await authService.googleLogin(idToken);
  res.status(200).json({ status: "User logged in successfully", data: result });
});


authController.post("/refresh-token", validation(validators.refreshToken), async (req, res) => {
  const result = await authService.refreshAccessToken(req.validate.body.refreshToken);
  res.status(200).json({ status: "Token refreshed successfully", data: result });
});



authController.post("/logout", authenticate, decodeRefreshToken , async (req, res , next) => {
  const result = await authService.logout(req.accessTokenData, req.refreshTokenData);
  res.status(200).json({ status: "User logged out successfully", data: result });
})

authController.patch('/confirm-email', async(req,res)=>{
  const {email , otp} = req.body
 const result = await authService.confirmEmail(email,otp);
  res.status(200).json({ message: "Email Confirmed successfully", data: result });
})



authController.post('/enable-2step', authenticate, async (req, res) => {
  const result = await authService.enableTwoStep(req.authUser)
  res.status(200).json({ message: 'OTP sent to your email', data: result })
})

authController.patch('/confirm-enable-2step', authenticate, validation(validators.confirmEnableTwoStep), async (req, res) => {
  const { otp } = req.validate.body
  const result = await authService.confirmEnableTwoStep(req.authUser, otp)
  res.status(200).json({ message: '2-step verification enabled successfully', data: result })
})

authController.post('/login-confirmation', validation(validators.loginConfirmation), async (req, res) => {
  const { email, otp } = req.validate.body
  const result = await authService.loginConfirmation(email, otp)
  res.status(200).json({ status: 'User logged in successfully', data: result })
})

authController.post('/resend-email', validation(validators.resendEmail), async (req, res) => {
  const { email } = req.validate.body
  const result = await authService.resendEmail(email)
  res.status(200).json({ message: 'Verification code sent to your email', data: result })
})

authController.post('/forgot-password', validation(validators.forgotPassword), async (req, res) => {
  const { email } = req.validate.body
  const result = await authService.forgotPassword(email)
  res.status(200).json({ message: 'If the email exists, a verification code was sent', data: result })
})


authController.patch('/reset-password', validation(validators.resetPassword), async (req, res) => {
  const { email, otp, password } = req.validate.body
  const result = await authService.resetPassword(email, otp, password)
  res.status(200).json({ message: 'Password reset successfully', data: result })
})

export default authController;