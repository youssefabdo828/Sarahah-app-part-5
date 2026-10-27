import multer from 'multer'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { allowedExtension } from '../common/enum/constants.js';
import { BadRequestException } from '../Utils/Errors/exception.error.js';
import { fileTypeFromFile } from 'file-type';

export const multerUpload = ({desiredPath})=>{


    const fullDestinationPath = `uploads/${desiredPath}`;
    if (!fs.existsSync(fullDestinationPath)) {
    fs.mkdirSync(fullDestinationPath,{recursive:true})
}


const storage = multer.diskStorage({
    destination: function (req,file,cb) {
        cb(null,fullDestinationPath)
    },
    filename: function (req,file,cb){
        const suffix = crypto.randomBytes(5).toString('hex') +  Date.now()
        cb(null,`${suffix} __ ${file.originalname}`)
    }
})


const fileFilter = async (req,file,cb) =>{
    const [fileType ,inputFileExtention] = file.mimetype.split("/");
const fileExtensions = allowedExtension[fileType]


if (fileExtensions.includes(inputFileExtention)) {
    cb(null,true)
}else{
    cb(new BadRequestException("invalid file extnesion"), false)
}
}

    return multer({fileFilter,storage})
}