/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import { log } from "string-player";
import catchError, { namedErrorCatching } from "./catchError.js";
import fetch from "node-fetch";
import fs from 'fs'
import { resolve } from "path";
import {__dirname} from '../env.js'
import request, { GET, POST } from "./fetch.js";
import getUserURN from "./getUserURN.js";



export default class Linkedin {
    constructor({ client_key,client_secret,redirect_uri,access_token,scopes, user_urn ,user_id}) {
        this.client_key=client_key;
        this.client_secret=client_secret;
        this.user_urn=user_urn;
        this.user_id=user_id;
        if (!redirect_uri) throw {
            massage :'redirect_uri can not be undefined'
        }
        this.redirect_uri=redirect_uri;
        this.scopes=[`profile`,`email`,`w_member_social`];
        this.attemps=0;
        if (access_token) this.access_token=access_token;
        if (scopes) this.scopes=scopes;
    }
    getAuthUrl=function getAuthUrl(req,res) {
        let client_id=this.client_key,redirect_uri=this.redirect_uri,scope=this.scopes;
        try {
            let params=(new URLSearchParams({
                response_type :'code',
                client_id ,
                redirect_uri ,
                scope
            })).toString();
            res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
        } catch (error) {
          return catchError(res,error) 
        }
    };
    getUserIdentityInfo=async function (access_token) {
        if (!access_token) {
            access_token = this.access_token;
        }
        let response= await GET('https://api.linkedin.com/v2/me',  {
            headers :{
                Authorization :'Bearer '+access_token
            },
        });
        log(response);
        if (!response.id || !response.vanityName ) {
            throw response
        }
        return {
            id :response.id ,
            urnname : response.vanityName,
            urn:`urn:li:person:${response.vanityName}`
        };
    }

    async getPageIds(access_token) {
        let params=(new URLSearchParams({q: 'roleAssignee'})).toString();
        let response=await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?'+params , {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "X-Restli-Protocol-Version": "2.0.0"
            },
        });
        let data=await response.json().catch(e => ({error :'can not parse json data'}));
        if (Array.isArray(data.elements) ) {
            if (data.elements.length>=1) {
                let org=[];
                for (let i = 0; i < data.elements.length; i++) {
                    let {state,role,organizationalTarget}=data.elements[i];
                    if (state === 'APPROVED') { 
                        if (role === 'ADMINISTRATOR') { 
                            if (organizationalTarget) {
                                org.push(organizationalTarget)
                            }
                        }
                    }
                }
                if (org.length >=1) return org;
                if (org.length ===0) return undefined;
            } else return undefined;
        } 
        throw data
    } 
    getAccessToken=async function getAccessToken(req,res) {
        try {
            if (!req.query.code) {
                throw {
                    name: 'perametar error',
                    massage :'Code is not define',
                    errorData:req.query
                }
            }
            let params=(new URLSearchParams({
                grant_type: 'authorization_code',
                code: req.query.code,
                redirect_uri: this.redirect_uri,
                client_id: this.client_key,
                client_secret: this.client_secret,
            })).toString();
            let response=await fetch(`https://www.linkedin.com/oauth/v2/accessToken?${params}`,{method:'POST'});
            response=await response.json();
            console.log(response);
            if (response.access_token) {
                let 
                access_token =response.access_token,
                refresh_token=response.refresh_token,
                userData =await getUserURN(response.access_token);
                return {
                    access_token ,
                    ...response,
                    ...userData
                }
            }
            if (!response.access_token) {
                throw response
            }
        } catch (error) {
            return namedErrorCatching('access token gaining error',error)        
        }
    }
    initializeVideo=async function initializeVideo({access_token,person_urn}) {
        try {
            log('initializing video upload')
            let response=await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
                body :JSON.stringify({
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
                        owner: person_urn, // Replace with the actual person URN
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent',
                            },
                        ],
                    },
                }),
                headers :{
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
                method :'POST'
            });
            response=await response.json();
            const checkCondition = (function () {
                if (response.value) {
                    return true
                } else {
                    return false
                }
            })();
            if (!checkCondition) {
                throw response
            }
            return {
                url :response.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
                asset :response.value.asset
            }
            // return { uploadUrl:response.value.uploadInstructions.uploadUrl}
        } catch (error) {
            namedErrorCatching('initialize Video error',error)
        }
    }
    uploadVideoBuffer=async function uploadVideoBuffer({buffer,access_token,uploadUrl}) {
        try {
            log('video uploading started...')
            let response= await fetch(uploadUrl, {
                body:buffer,
                headers :{
                    'Content-Type': 'application/octet-stream',
                    // Authorization :'Bearer '+access_token
                },
                method :'PUT'
            });
            log({status :response.status});
            if (response.status===201) return true
            if (response.status!==201) {
                response=await response.json().catch(error => {return {}});
                throw response
            }
        } catch (error) {
            console.error(error);
            namedErrorCatching('Vidoe buffer uploading error',error)
        }
    }
    
    finishVideoUpload=async function finishVideoUpload({access_token,person_urn,asset,user_id}) {
        try {
            if (!user_id) {
                user_id=this.user_id;
                if (!user_id) {
                    throw {
                        massage :"Please give a user id"
                    }
                }
            }
            log('finishing video upload...')
            let response= await fetch('https://api.linkedin.com/v2/ugcPosts', {
                method :'POST',
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    "X-RestLi-Id":'2.0.0'
                },
                body:JSON.stringify({
                    author:"urn:li:member:346664455",// `urn:li:member:${user_id}`, 
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: {
                                text: 'this birds are beautiful',
                            },
                            shareMediaCategory: 'VIDEO',
                            media: [
                                {
                                    status: 'READY',
                                    description: {
                                        text: 'Tthis birds are beautiful',
                                    },
                                    media: asset,
                                    title: {
                                        text: 'this birds are beautiful',
                                    },
                                },
                            ],
                        },
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                    },
                }),
                
            });
            let status=response.status;
            response = await response.json().catch(error => {
                return ({
                    error: 'UnExpected end of json data'
                })
            });
            console.log(response);
            if (status >299) {
                throw response
            }
            return true
        } catch (error) {
            namedErrorCatching('video upload finishing error',error)
        }
    }
    uploadVideoToUserAccount=async function uploadVideoToUserAccount({access_token,person_urn}) {
        // let access_token=this.access_token;

        let initializedUploadData=await this.initializeVideo({access_token,person_urn});
        let 
        uploadUrl=initializedUploadData.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
        asset=initializedUploadData.asset;
        let isUploaded=await this.uploadVideoBuffer({
            buffer :fs.readFileSync(resolve(__dirname, './public/birds.mp4')),
            uploadUrl ,
        });
        const finishResponse=await this.finishVideoUpload({
            person_urn :'abc1234',
            asset,
            access_token
        });
    }
    registerImageUpload=async function (accessToken, personURN) {
        try {
            let response=await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
                method :'POST',
                body: JSON.stringify({
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                        owner: personURN, // e.g., 'urn:li:person:abc123'
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent',
                            },
                        ],
                    },
                }),
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });
            let status = response.status;
            response = await response.json();
            if (status > 299 || response.error || !response.value) {
                if (response.error) throw response.error
                throw response
            }
            return response.value
        } catch (error) {
            namedErrorCatching('registerImageUpload error',error)
        }
    }
    uploadImageBuffer=async function uploadImageBuffer(uploadUrl, imageBuffer,accessToken) {
        try {
            let response=await fetch(uploadUrl, {
                body: imageBuffer,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                   'Content-Type': 'application/octet-stream',
                },
                method :'PUT'
            });
            let status = response.status;
            response = await response.json();
            if (status > 299 || response.error ) {
                if (response.error) throw response.error
                throw response
            }
            return response
        } catch (error) {
            namedErrorCatching('Image upload error', error)
        }
    }
    createImagePost =async function (accessToken, personURN, assetURN) {
        try {
            let response=await fetch( 'https://api.linkedin.com/v2/ugcPosts', {
                method :'POST',
                body:JSON.stringify({
                    author: personURN, // e.g., 'urn:li:person:abc123'
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: {
                                text: 'Check out this image!',
                            },
                            shareMediaCategory: 'IMAGE',
                            media: [
                                {
                                    status: 'READY',
                                    description: {
                                        text: 'A great image!',
                                    },
                                    media: assetURN, // Asset URN from register upload step
                                    title: {
                                        text: 'Image Title',
                                    },
                                },
                            ],
                        },
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                    },
                }),
                headers :{
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });
            let status=response.status;
            response=await response.json();
            return response
        } catch (error) {
            namedErrorCatching('createImagePost error', error)
        }
    }
    publishImagePost=async function (accessToken, personURN, assetURN,imagePath) {
        try {
            let uploadData=await this.registerImageUpload(accessToken, personURN);
            let uploadUrl = uploadData.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            let assetURN = uploadData.asset;

            const isUploaded = await uploadImage(uploadUrl, imageBuffer);
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async exchangeAccessToken(refresh_token) {
        let client_id = this.client_key, client_secret = this.client_secret, grant_type = 'refresh_token';
        let body = (new URLSearchParams({ client_id, client_secret, grant_type, refresh_token })).toString()
        let response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            body: body,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        response = await response.json().catch(e => {return ({ error: "can't parse json" })});
        if (response.access_token && response.refresh_token) {
            return ({
                access_token: response.access_token,
                refresh_token: response.refresh_token
            });
        }
        throw response;
    }

    //page video
    page={
        initVideo:async function (accessToken, organization_urn) {
            let response = await request.post(
                'https://api.linkedin.com/v2/assets?action=registerUpload',
                {
                    registerUploadRequest: {
                        owner: organization_urn,
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
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

           
            if (response.error || !response.value || !response.value?.asset) {
                log(response)
                if (response.error) log(response.error)
                throw (response.error ? response.error : response)
            }

            let 
            asset=response.value.asset ,uploadUrl= response.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
            return {
                uploadUrl ,
                asset
            }
        },
        uploadVideo: async function (url, buffer, accessToken) {
            log('upload...')
            let isUploaded = await fetch(url, {
                body: buffer,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    Authorization: `Bearer ${accessToken}`,
                },
                method: 'PUT'
            })
            .then(response => {
                let isUploaded=(response.status < 300);
                if (!isUploaded ) throw 'failded to upload the video'
            });
        },
        finishVideoUpload:async function (asset,accessToken,organization,title,visibility="PUBLIC" ) {
            log('finish...')
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
                            shareMediaCategory: "VIDEO",
                            media: [
                                {
                                    status: "READY",
                                    description: {
                                        text:  title
                                    },
                                    media:asset, // Video asset URN
                                    title: {
                                        text:title
                                    }
                                }
                            ]
                        }
                    },
                    visibility: {
                        "com.linkedin.ugc.MemberNetworkVisibility": visibility
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!response.id) {
                throw response
            }
            return response.id
        },
        postVideo:async function (accessToken,organization,buffer,title,visibility="PUBLIC") {
            if (!accessToken) throw 'accessToken is undefined'
            if (!organization) throw 'organization is undefined'
            if (!buffer) throw 'buffer is undefined'
            if (!title) throw 'title is undefined'
            let {asset,uploadUrl}=await this.initVideo(accessToken,organization);
            await this.uploadVideo(uploadUrl,buffer,accessToken);
            let id=await this.finishVideoUpload(asset,accessToken,organization,title,visibility);
            // log(id)
            return id
        },
        initImage:async function (accessToken,organization) {
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

            return {
                asset,
                uploadUrl
            }
    
        },
        uploadImage: async function (uploadUrl ,buff, accessToken) {
            await fetch(uploadUrl, {
                method: 'PUT',
                body: buff,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/octet-stream',
                }
            })
                .then(
                    function (response) {
                        if (response.status > 299 || response.status < 200) {
                            throw 'failed to upload video ... and response code is ' + response.status
                        }
                    }
                )
        },
        finishSignleImagesUpload:async function ({accessToken,title,asset,organization,visibility}) {
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
                        "com.linkedin.ugc.MemberNetworkVisibility": visibility ?? "PUBLIC"
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        },
        uploadTEXT:async function ({accessToken,organization,text,visibility}) {
            let response = await request.post(
                'https://api.linkedin.com/v2/ugcPosts',
                {
                    author: organization, // Your organization URN
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        "com.linkedin.ugc.ShareContent": {
                            shareCommentary: {
                                text: text
                            },
                            "shareMediaCategory": "NONE"
                        }
                    },
                    visibility: {
                        "com.linkedin.ugc.MemberNetworkVisibility": visibility ?? "PUBLIC"
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.id) return response.id;
            if (!response.id && response.error) throw response.error;
            throw response;
            
        }
    }
}