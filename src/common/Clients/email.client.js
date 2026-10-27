import nodemailer from 'nodemailer';
import { emailConfig } from '../../Config/email.config.js';


export const emailTransporter = nodemailer.createTransport(emailConfig);