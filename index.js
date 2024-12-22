/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import express from 'express'
import { breakJsonData, log } from 'string-player';
import path, { resolve } from 'path'
import { require, __dirname, LINKEDIN_SECRET, LINKEDIN_KEY, LINKEDIN_REDIRECT_URI, NEW_LINKEDIN_KEY, NEW_LINKEDIN_SECRET, assentialHeaders } from './env.js'
import catchError from './controllars/catchError.js';
import fetch, { FormData } from 'node-fetch';
import { writeFileSync } from 'fs';
import getUserURN from './controllars/getUserURN.js';
import Linkedin from './controllars/linkedin.js';
import fs from 'fs'
import newVideoLinkedinUploadApproach from './controllars/newVideoLinkedinUploadApproach.js';
import request, { GET, jsonErrorHandler } from './controllars/fetch.js';

const app = express();
app.use(express.static(path.resolve(__dirname, './public')));
app.get('/', (req, res) => res.redirect('/Auth.html'));


let LinkedinBot = new Linkedin({
    client_key: NEW_LINKEDIN_KEY,
    client_secret: NEW_LINKEDIN_SECRET,
    redirect_uri: "http://localhost:3000/callback",
    scopes: [
        `profile`,
        `email`,
        `w_member_social`,
        'openid',
    ],
    access_token: require('./li.json').access_token,
    user_id: require('./li.json').id,
})


app.get('/get-code', (req, res) => LinkedinBot.getAuthUrl(req, res));

app.get('/callback', async function (req, res) {
    try {
        let response = await LinkedinBot.getAccessToken(req, res);
        if (response.access_token) {
            writeFileSync(resolve(__dirname, './li.json'), breakJsonData(response));
            return res.redirect('/verified.html');
        }
        if (!response.access_token) {
            throw response
        }
    } catch (error) {
        console.log(error)
        return catchError(res, error)
    }
});

app.get('/upload-a-video', async function (req, res) {
    try {
        access_token = require('./li.json').access_token,
            person_urn = require('./li.json').urn;
        let response = await LinkedinBot.initializeVideo({
            access_token,
            person_urn
        });
        log('video is registered')
        log(response);
        let uploadUrl = response.url, asset = response.asset;
        await LinkedinBot.uploadVideoBuffer({
            buffer: videoPathBuffer,
            access_token,
            uploadUrl
        })
        let status = await LinkedinBot.finishVideoUpload({
            access_token,
            person_urn,
            asset
        })
        res.json(status ? { massage: 'Sucessfully video was uploaded' } : { error: 'failed to upload a the video' });
    } catch (error) {
        return catchError(res, error)
    }
})


app.get('/get-user-info', async function (req, res) {
    try {
        let access_token = "AQVTh2g_cvuN-plZ4u7-SsKs575wo4W_K9rgLo1crza12PvMro8zDMjBCsX8Q-5Nw8bs5JRiwJeS3h0RvCwktINKOnj2UJr4XGYp3dTHKlupvLr8-r8fnKqnBXVhuNnvganiEMdVO-L7E4ffvheu2kskJH05U1wQcrnaX-PqHoAK7EV8zgwOsManoGxwzrEVwJVs1ytfb9Zgu0SqRJE1AqKNcnPZidoChdXVLLK2V7ct5Etq2qIHJ-rjqFhyHec0qSAj_hQlhjpwD-vWSJAZrWQtz2UPCFR08bDHnPYMT3jDtaIAp0k1w00hVnyxkUiVzPoSjssTuh4W5NK35-i7LV4Lr2tLcg";
        let response = await LinkedinBot.getUserIdentityInfo();
        console.log(response);

        let data = breakJsonData({
            access_token,
            ...response
        });
        writeFileSync(resolve(__dirname, './li.json'), breakJsonData(data));
        return res.send('data seved')
    } catch (error) {
        console.error(error);
    }
})

app.get('/page', function (req, res) {
    GET('https://api.linkedin.com/rest/organizationAcls?q=roleAssignee', {
        headers: {
            Authorization: `Bearer ${require('./li.json').access_token}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202411'
        }
    })
        .then(data => {
            res.json(data);
            fs.writeFileSync(path.resolve(__dirname, './org-data.json'), breakJsonData(data));
        })
})

app.get('/page/video',
    async function (req, res) {
        try {
            log('init....')
            let
                organization = 'urn:li:organization:104976884',
                accessToken = require('./li.json').access_token,
                buffer =fs.readFileSync(path.resolve(__dirname, './public/birds.mp4')),
                title ="WHAT A BEATIFUL BIRD...";

            let id=await LinkedinBot.page.postVideo(
                accessToken,
                organization,
                buffer,
                title
            );
            log(id);
            return res.json({id});
        } catch (error) {
            catchError(res, error)
        }
    },
    // async function (req, res) {
    //     try {
    //         let organization = 'urn:li:organization:104976884'
    //         log('// video initializing... ');
    //         let headers = {
    //             ...assentialHeaders,
    //             'Authorization': 'Bearer ' + require('./li.json').access_token
    //         }
    //         let response = await request.post('https://api.linkedin.com/rest/videos?action=initializeUpload',
    //             {
    //                 initializeUploadRequest: {
    //                     owner: organization,
    //                     fileSizeBytes: videoPathBuffer.length,
    //                     uploadCaptions: true,
    //                     uploadThumbnail: false
    //                 }
    //             },
    //             {
    //                 headers,
    //                 giveDetails: true
    //             }
    //         );

    //         if (response.status !== 200) {
    //             throw response.json
    //         }
    //         log(response.json.value)
    //         let
    //             video = response.json.value.video,
    //             uploadUrl = response.json.value.uploadInstructions[0].uploadUrl;
    //         log('// video uploading... ');

    //         // response=await fetch(uploadUrl, {
    //         //     method :'POST',
    //         //     body :videoPathBuffer,
    //         //     headers :{
    //         //         "Content-Type":"application/octet-stream"
    //         //     }
    //         // });
    //         let form = new FormData();
    //         form.append("metadata", JSON.stringify({
    //             "format": "SRT",
    //             "formattedForEasyReader": true,
    //             "largeText": true,
    //             "source": "USER_PROVIDED",
    //             "locale": {
    //                 "variant": "AMERICAN",
    //                 "country": "US",
    //                 "language": "EN"
    //             },
    //             "transcriptType": "CLOSED_CAPTION"
    //         }));
    //         form.append('file', videoPathBuffer);

    //         response = await fetch(uploadUrl, {
    //             body: form,
    //             headers: {}
    //         })
    //         log(response.status)

    //         if (response.status !== 200) {
    //             response = await response.json().catch(jsonErrorHandler);
    //             throw response
    //         }
    //         return
    //         response = await request.post('https://api.linkedin.com/rest/videos?action=finalizeUpload',
    //             {
    //                 finalizeUploadRequest: {
    //                     video,
    //                     uploadToken: "",
    //                 }
    //             },
    //             {
    //                 headers
    //             }
    //         );
    //         log(response);
    //         return res.json(response)
    //     } catch (error) {
    //         catchError(res, error)
    //     }
    // },

)

app.get('/page/image',async function (req,res) {
    try {
        log('init....');
        let
                organization = 'urn:li:organization:104976884',
                accessToken = require('./li.json').access_token,
                title ='what a beatiful bird and nature',
                buff =fs.readFileSync(path.resolve(__dirname,'./public/1.jpg'));
        let response = await request.post(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
                registerUploadRequest: {
                    owner: organization, // Replace with your organization URN
                    recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                    serviceRelationships: [
                        {
                            relationshipType: 'OWNER',
                            identifier: 'urn:li:userGeneratedContent',
                        },
                    ],
                    supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.error || !response.value || !response.value?.asset ) {
            throw (response.error ? response.error : response);
        }
        
        let 
        uploadUrl=response.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl,
        asset=response.value.asset;

        await fetch(uploadUrl,{
            method :'PUT',
            body :buff,
            headers :{
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/octet-stream',
            }
        })
        .then(
            function(response) {
                if (response.status>299 || response.status < 200) {
                    throw 'failed to upload video ... and response code is '+response.status
                }
            }
        )


        response = await request.post(
            'https://api.linkedin.com/v2/ugcPosts',
            {
                author: organization, // Your organization URN
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: title
                        },
                        shareMediaCategory: "IMAGE",
                        media: [
                            {
                                status: "READY",
                                description: {
                                    text:title
                                },
                                media: asset, // Image asset URN
                                title: {
                                    text: title
                                }
                            }
                        ]
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.json(response);
    } catch (error) {
        catchError(res,error)
    }
});


app.get('/page/images', async function (req,res) {
    try {
        let  
        organization = 'urn:li:organization:104976884',
        accessToken = require('./li.json').access_token,
        title ='what a beatiful bird and nature',
        images = ['1.jpg', '2.jpg'],
        mediaData=[];

        for (let i = 0; i < images.length && i <= 5; i++) {
            log('init....')
            let {uploadUrl,asset}=await LinkedinBot.page.initImage(accessToken,organization);
            log('buffer...')
            let buffer=fs.readFileSync(path.resolve(__dirname,`./public/${images[i]}`));
            log('uplaod...')
            await LinkedinBot.page.uploadImage(uploadUrl,buffer,accessToken);
            log('push...')
            mediaData.push({
                status: "READY",
                description: {
                    text: title
                },
                media: asset, 
                title: {
                    text: title
                }
            })
        }

        let response = await request.post(
             'https://api.linkedin.com/v2/ugcPosts',
            {
                author: organization, // Your organization URN
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: title
                        },
                        shareMediaCategory: "IMAGE",
                        media: mediaData
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        log(response);
        return res.json(response);


    } catch (error) {
        catchError(res,error)
    }
})
app.get('/page/text',async function (req,res) {
    
})
app.listen(3000, serverData => log('Thanks to Allah ,by his marcy server is started '))