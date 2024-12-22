import catchError from "./catchError.js";

/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/


import {GET} from './fetch.js'
export default async function getUserURN(access_token) {
    try {
        let response = await GET('https://api.linkedin.com/v2/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        });
        if (!response.id ||!response.vanityName || response.error ) throw (!response.id ? response : response.error)
        return ({
            urn: `urn:li:person:${response.vanityName}`,
            id :response.id
        })
    } catch (error) {
        console.log(error);
        throw 'user urn gaining error'
    }
}