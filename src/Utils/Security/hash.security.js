import bcrypt from "bcrypt";

export const hash = (plainText) => {
    return bcrypt.hash(plainText, 12);
}


export const compareTwoHashes = (hash , planText) =>{
    return bcrypt.compare(planText, hash);
}