import { tokenTypeEnum } from "../common/enum/constants.js";
import { BadRequestException } from "../Utils/Errors/exception.error.js";
import { decodeToken } from "../Utils/Security/token.utils.js";


export const decodeRefreshToken = async (req, res, next) => {
    const { refreshtoken } = req.headers;
    if (!refreshtoken) {
        throw new BadRequestException("Refresh token header is missing" , null, "UNAUTHORIZED");
    }

    const [prefix, token] = refreshtoken.split(" ");
    if (prefix !== "Bearer" || !token) {
        throw new BadRequestException("Invalid authorization header format", null, "UNAUTHORIZED");
    }

const { TokenData } = await decodeToken(token, tokenTypeEnum.REFRESH_TOKEN);


    req.refreshTokenData = TokenData;
    next();
};