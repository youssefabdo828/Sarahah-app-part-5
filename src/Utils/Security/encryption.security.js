import crypto from 'node:crypto'
import envConfig from '../../Config/env.config.js';

const ENCRYPTION_KEY = Buffer.from(envConfig.encryption.key, 'hex');
const IV_LENGTH = envConfig.encryption.iv;


export const encrypt = (plainText) => {
 const iv = crypto.randomBytes(IV_LENGTH);

    const cipherObject = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);


    let cipherText = cipherObject.update(plainText, 'utf-8', 'hex');
  cipherText += cipherObject.final('hex');


  return `${iv.toString('hex')}:${cipherText}`;
};







export const decrypt = (cipher) => {
    const [iv , encryptedText] = cipher.split(':')

    const bufferedIv = Buffer.from(iv , 'hex')
    const decipherObject = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, bufferedIv)

        let decipherText = decipherObject.update(encryptedText, 'hex', 'utf-8');
  decipherText += decipherObject.final('utf-8');



  return decipherText
}