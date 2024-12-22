/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';


export const __dirname=path.dirname(fileURLToPath(import.meta.url));
export const require=createRequire(import.meta.url);
export const LINKEDIN_KEY=process.env.LINKEDIN_KEY
export const NEW_LINKEDIN_KEY=process.env.NEW_LINKEDIN_KEY
export const NEW_LINKEDIN_SECRET=process.env.NEW_LINKEDIN_SECRET
export const LINKEDIN_SECRET=process.env.LINKEDIN_SECRET
export const LINKEDIN_REDIRECT_URI=process.env.LINKEDIN_REDIRECT_URI
export const LINKEDIN_PERSON_URN=process.env.LINKEDIN_PERSON_URN
export const LINKEDIN_VERSION=202411
export const XRestLiProtocolVersion ={
    "X-RestLi-Protocol-Version" :'2.0.0'
}
export const assentialHeaders= {
    'X-RestLi-Protocol-Version': '2.0.0',
    "LinkedIn-Version":"202411"
}