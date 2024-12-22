/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import fetch from "node-fetch";
import catchError from "./catchError.js";



async function initializeVideo({ }) {
    let response = await fetch(`https://api.linkedin.com/rest/videos?action=initializeUpload`, {
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({
            initializeUploadRequest :{
                
            }
        }),
        method: 'POST'
    });
    response = await response.json();

}


















