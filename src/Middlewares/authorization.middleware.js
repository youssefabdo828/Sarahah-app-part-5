import { UnauthorizedException } from "../Utils/Errors/exception.error.js";




export const authorize = (allowedRoles) => {
return (req, res, next) => {
    const loggedInUserRole = req.authUser.role;
    if (!allowedRoles.includes(loggedInUserRole)) {
        throw new UnauthorizedException("You are not authorized to perform this action" , null, "UNAUTHORIZED");
    }
    next();
}
}