import jwt from "jsonwebtoken";
import { BadRequestException, UnauthorizedException } from "../Errors/exception.error.js";
import envConfig from "../../Config/env.config.js";
import UserRepository from "../../DB/Repositories/user.repository.js";
import { tokenTypeEnum } from "../../common/enum/constants.js";
import { get } from "../../common/Services/radis.service.js";

const userRepo = new UserRepository();

const jwtConfig = envConfig.jwt;

export const generateToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
}


export const verifyToken = (token, secret) => {
        return jwt.verify(token, secret);
};


export const decodeToken = async (token, tokenType) => {
    const data =  jwt.decode(token);
    if (!data?.role) throw new BadRequestException(`role is missing in token`, null, "ROLE_MISSING");


    const signature = getSignatureByRoleAndType({role: data.role, tokenType});


    const decodedData = verifyToken(token, signature);

    const isTokenBlacklisted = await get(`bl_${tokenType}_${decodedData.jti}`);
    if (isTokenBlacklisted) {
        throw new UnauthorizedException("Token is revoked try logging in again", null, "TOKEN_BLACKLISTED");
    }

    const user = await userRepo.findDocumentById(decodedData._Id, '-password');
    if (!user) {
        throw new BadRequestException("User not found", null, "UNAUTHORIZED");
    }
    return { user, TokenData:decodedData };
};



const getSignatureByRoleAndType = ({role, tokenType}) => {
    const roleSignatures = jwtConfig[role];
    if (!roleSignatures) throw new BadRequestException('Invalid role in token', null, 'INVALID_ROLE');
let signature;
    switch (tokenType) {
        case tokenTypeEnum.ACCESS_TOKEN:
            signature = roleSignatures.accessTokenSecret;
            break;
        case tokenTypeEnum.REFRESH_TOKEN:
            signature = roleSignatures.refreshTokenSecret;
            break;
        default:
            throw new BadRequestException(`Invalid token type`, null, "INVALID_TOKEN_TYPE");
    }
    return signature;
}