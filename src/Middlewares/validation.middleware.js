import { BadRequestException } from "../Utils/Errors/exception.error.js"

export const validation = (schema) =>{
    return (req,res,next) =>{
            const validationResult = schema.safeParse({body : req.body , params : req.params , query : req.query})
    if(!validationResult.success){
      throw new BadRequestException("Validation Error" , validationResult.error.issues)
};
req.validate = validationResult.data
    next();
    };
};