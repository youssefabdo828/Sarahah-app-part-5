import { encrypt } from '../../Utils/Security/encryption.security.js';
import { hash, compareTwoHashes } from "../../Utils/Security/hash.security.js";
import UserRepository from "../../DB/Repositories/user.repository.js";
import { BadRequestException, ConflictException } from "../../Utils/Errors/exception.error.js";
import envConfig from "../../Config/env.config.js";
import { decodeToken, generateToken} from "../../Utils/Security/token.utils.js";
import {OAuth2Client} from 'google-auth-library';
import { emailOTPExpiration, providersEnum, tokenTypeEnum } from "../../common/enum/constants.js";
import crypto from 'node:crypto';
import { calculateTTL, set, get, del , TTL } from "../../common/Services/radis.service.js";
import { v4 as uuidv4 } from 'uuid';
import { eventEmitter } from '../../common/Services/email.service.js';

const userRepo = new UserRepository()

const sendOtp = async ({ email, redisKey, subject }) => {
  const otp = crypto.randomInt(100000, 1000000).toString()
  const hashedOtp = await hash(otp)

  await set({ key: redisKey, value: hashedOtp, options: { EX: emailOTPExpiration } })

  eventEmitter.emit('sendMailEvent', {
    to: email,
    subject,
    message: `
      <h1>This is your Verification OTP</h1>
      <h2>${otp}</h2>
      <h3>This otp is valid for 5 minutes</h3>
    `
  })
}

const handleSendingVerificationOtp = async (email) => {
  await sendOtp({
    email,
    redisKey: `email_verification:${email}`,
    subject: 'Email Verification'
  })
}

export const registerUser = async (body) => {
  const { firstName, lastName, email, password, gender, age, phone } = body

  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) {
    throw new ConflictException('User with this email already exists', { duplicatedEmail: email }, 'EMAIL_CONFLICT');
  }

  let encryptPhone;
  if (phone) encryptPhone = encrypt(phone)
  const hashedPassword = await hash(password)

 await handleSendingVerificationOtp(email)

  return userRepo.createNewDocument({ firstName, lastName, email, password: hashedPassword, gender, age, phoneNumber: encryptPhone || undefined })
}

const buildTokens = (user) => {
  const roleConfig = envConfig.jwt[user.role];
  const tokensPayload = { _Id: user._id, email: user.email, role: user.role };

  const accessToken = generateToken(tokensPayload, roleConfig.accessTokenSecret, { expiresIn: roleConfig.accessTokenExpiresIn, jwtid: uuidv4()  });
  const refreshToken = generateToken(tokensPayload, roleConfig.refreshTokenSecret, { expiresIn: roleConfig.refreshTokenExpiresIn , jwtid: uuidv4() });

  return { accessToken, refreshToken };
}


export const login = async (body) => {
  const MAX_LOGIN_ATTEMPTS = 5
const BAN_DURATION_SECONDS = 5 * 60
  const { email, password } = body

  const isEmailExist = await userRepo.findUserByEmail(email)
  if (!isEmailExist) throw new BadRequestException('Invalid email or password', null, 'UNAUTHORIZED')

     const banKey = `login_ban:${email}`
  const attemptsKey = `login_attempts:${email}`

  const isBanned = await get(banKey)
  if (isBanned) {
    const remaining = await TTL(banKey)
    throw new BadRequestException(
      `Too many failed attempts, try again after ${Math.ceil(remaining / 60)} minute(s)`,
      null,
      'ACCOUNT_TEMPORARILY_BANNED'
    )
  }
  const isPasswordMatched = await compareTwoHashes(isEmailExist.password, password)
  if (!isPasswordMatched){
const attempts = Number(await get(attemptsKey) || 0) + 1

     
   if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await set({ key: banKey, value: '1', options: { EX: BAN_DURATION_SECONDS } })
      await del(attemptsKey)
    } else {
      await set({ key: attemptsKey, value: String(attempts), options: { EX: BAN_DURATION_SECONDS } })
    }
         throw new BadRequestException('invalid email or password', null, 'UNAUTHORIZED')
  }
  


  await del(attemptsKey)

  if (isEmailExist.isTwoStepEnabled) {
    await sendOtp({
      email: isEmailExist.email,
      redisKey: `two_step_login:${isEmailExist.email}`,
      subject: 'Login Verification Code'
    })
    return { twoStepRequired: true, message: 'A verification code was sent to your email' }
  }

  return buildTokens(isEmailExist)
};

export const loginConfirmation = async (email, otp) => {
  const key = `two_step_login:${email}`

  const hashedOtp = await get(key)
  if (!hashedOtp) throw new BadRequestException('Invalid email or your otp is expired', null, 'OTP_EXPIRATION')

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) throw new BadRequestException('Invalid otp', null, 'OTP_INVALID')

  const user = await userRepo.findUserByEmail(email)
  if (!user) throw new BadRequestException('Invalid email or your otp is expired', null, 'OTP_EXPIRATION')

  await del(key)

  return buildTokens(user)
}

const verifyIdtoken = async (token) => {
const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: envConfig.GCP.client_id
  });
  const payload = ticket.getPayload();
return payload;
}


export const refreshAccessToken = async (token) => {
  const { user } = await decodeToken(token, tokenTypeEnum.REFRESH_TOKEN);
  const roleConfig = envConfig.jwt[user.role];
if (!roleConfig) {
  throw new Error(`No JWT config found for role: ${user.role}`);
}
  const accessToken = generateToken(
    { _Id: user._id, email: user.email, role: user.role },
    roleConfig.accessTokenSecret,
    { expiresIn: roleConfig.accessTokenExpiresIn, jwtid: uuidv4()  }
  );

  return { accessToken };
};

const updateOrCreateUser = async (user , googleTokenPayload) => {
  const { email, given_name, family_name, sub } = googleTokenPayload;
  if (user) {
    return await userRepo.updateDocumentById(user._id, {
      firstName: given_name,
      lastName: family_name,
      email
    }, { new: true });
} else {
  const hashedPassword = await hash(crypto.randomBytes(12).toString('hex'));
return userRepo.createNewDocument({
      firstName: given_name,
      lastName: family_name,
      email,
      googleSub: sub,
      provider: providersEnum.GOOGLE,
      password: hashedPassword
    });
}}


export const googleRegister = async (idToken) => {
const googleTokenPayload = await verifyIdtoken(idToken);
if(!googleTokenPayload || !googleTokenPayload.email_verified){
  throw new BadRequestException("Google email is not verified" , null , 'GOOGLE_EMAIL_NOT_VERIFIED');
}

const user = await userRepo.findOneDocument({ googleSub: googleTokenPayload.sub , provider: providersEnum.GOOGLE});

const handleUser = await updateOrCreateUser(user , googleTokenPayload);


return buildTokens(handleUser)
};


export const googleLogin = async (idToken) => {
  const googleTokenPayload = await verifyIdtoken(idToken);
  if(!googleTokenPayload || !googleTokenPayload.email_verified){
  throw new BadRequestException("Google email is not verified" , null , 'GOOGLE_EMAIL_NOT_VERIFIED');
}

const user = await userRepo.findOneDocument({ googleSub: googleTokenPayload.sub , provider: providersEnum.GOOGLE});

if (!user) {
  throw new BadRequestException("User not found. Please register first." , null , 'USER_NOT_FOUND');
}

return buildTokens(user)
}



export const logout = async (accessTokenData, refreshTokenData) => {
  const {exp:accessExpiration , jti:accessId} = accessTokenData;
  const {exp:refreshExpiration , jti:refreshId} = refreshTokenData;

const accessTTL = calculateTTL(accessExpiration);
const refreshTTL = calculateTTL(refreshExpiration);

Promise.all([
  set({key: `bl_${tokenTypeEnum.ACCESS_TOKEN}_${accessId}`, value: "true", options: { EX: accessTTL }}),
  set({key: `bl_${tokenTypeEnum.REFRESH_TOKEN}_${refreshId}`, value: "true", options: { EX: refreshTTL }})
]);

return {accessTTL, refreshTTL};
}


export const confirmEmail = async (email , otp) =>{
  const hashedOtp = await get(`email_verification:${email}`)
  if(!hashedOtp)  throw new BadRequestException('Invalid email or your otp is expired', null, 'OTP_EXPIRATION')


    const isValidOtp = await compareTwoHashes(hashedOtp , otp.toString())
if(!isValidOtp) throw new BadRequestException('Invalid otp', null, 'OTP_INVALID')

await userRepo.updateOneDocument({email},{isEmailVerified:true})

  del(`email_verification:${email}`)

  return true
}



export const enableTwoStep = async (user) => {
  if (user.isTwoStepEnabled) {
    throw new BadRequestException('2-step verification is already enabled', null, 'TWO_STEP_ALREADY_ENABLED')
  }

  await sendOtp({
    email: user.email,
    redisKey: `two_step_enable:${user.email}`,
    subject: 'Enable 2-Step Verification'
  })

  return true
}

export const confirmEnableTwoStep = async (user, otp) => {
  const key = `two_step_enable:${user.email}`

  const hashedOtp = await get(key)
  if (!hashedOtp) throw new BadRequestException('Your otp is expired', null, 'OTP_EXPIRATION')

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) throw new BadRequestException('Invalid otp', null, 'OTP_INVALID')

  await userRepo.updateOneDocument({ email: user.email }, { isTwoStepEnabled: true })
  await del(key)

  return true
}


export const resendEmail = async (email) => {
  const user = await userRepo.findUserByEmail(email)
  if (!user) throw new BadRequestException('Invalid email', null, 'INVALID_EMAIL')

  if (user.isEmailVerified) {
    throw new BadRequestException('Email is already verified', null, 'EMAIL_ALREADY_VERIFIED')
  }

  const cooldownKey = `resend_cooldown:${email}`
  const isCoolingDown = await get(cooldownKey)
  if (isCoolingDown) {
    const remaining = await TTL(cooldownKey)
    throw new BadRequestException(
      `Please wait ${remaining} seconds before requesting a new code`,
      null,
      'RESEND_TOO_SOON'
    )
  }

  await sendOtp({
    email,
    redisKey: `email_verification:${email}`,
    subject: 'Email Verification'
  })

  await set({ key: cooldownKey, value: '1', options: { EX: 120 } })

  return true
}


export const forgotPassword = async (email) => {
  const user = await userRepo.findUserByEmail(email)
  if (!user) return true

  const cooldownKey = `forgot_cooldown:${email}`
  const isCoolingDown = await get(cooldownKey)
  if (isCoolingDown) {
    const remaining = await TTL(cooldownKey)
    throw new BadRequestException(
      `Please wait ${remaining} seconds before requesting a new code`,
      null,
      'RESEND_TOO_SOON'
    )
  }

  await sendOtp({
    email,
    redisKey: `forgot_password:${email}`,
    subject: 'Reset Your Password'
  })

  await set({ key: cooldownKey, value: '1', options: { EX: 60 } })

  return true
}




export const resetPassword = async (email, otp, newPassword) => {
  const key = `forgot_password:${email}`

  const hashedOtp = await get(key)
  if (!hashedOtp) throw new BadRequestException('Invalid email or your otp is expired', null, 'OTP_EXPIRATION')

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) throw new BadRequestException('Invalid otp', null, 'OTP_INVALID')

  const user = await userRepo.findUserByEmail(email)
  if (!user) throw new BadRequestException('Invalid email or your otp is expired', null, 'OTP_EXPIRATION')


  const isSamePassword = await compareTwoHashes(user.password, newPassword)
  if (isSamePassword) {
    throw new BadRequestException(
      'You cannot change your password to the same value',
      null,
      'SAME_PASSWORD'
    )
  }

  const hashedPassword = await hash(newPassword)
  await userRepo.updateOneDocument({ email }, { password: hashedPassword })

  await del(key)
  await del(`login_attempts:${email}`)
  await del(`login_ban:${email}`)

  return true
}