import HttpAppError from "./app.error.js";





export class BadRequestException extends HttpAppError {
    constructor( message = 'bad request' , data = {} , code = 'BAD_REQUEST' ){
        super(message , 400 , data , code)
    }
}


export class ConflictException extends HttpAppError {
    constructor( message = 'Conflict' , data = {} , code = 'CONFLICT' ){
        super(message , 409 , data , code)
    }
}


export class NotFoundException extends HttpAppError {
    constructor( message = 'Not found' , data = {} , code = 'NOT_FOUND' ){
        super(message , 404 , data , code)
    }
}
 
export class UnauthorizedException extends HttpAppError {
    constructor( message = 'Unauthorized' , data = {} , code = 'UNAUTHORIZED' ){
        super(message , 401 , data , code)
    }
}
 
export class ForbiddenException extends HttpAppError {
    constructor( message = 'Forbidden' , data = {} , code = 'FORBIDDEN' ){
        super(message , 403 , data , code)
    }
}