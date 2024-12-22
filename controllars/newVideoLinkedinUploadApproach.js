import { log } from "string-player"
import { POST } from "./fetch.js"



export default async function newVideoLinkedinUploadApproach({access_token,urn ,buffer,fileSize}) {
  let response = await POST('https://api.linkedin.com/rest/videos?action=initializeUpload',
    {
      initializeUploadRequest: {
        owner: urn,
        fileSizeBytes: fileSize,
        uploadCaptions: false,
        uploadThumbnail: false
      }
    },
    {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-RestLi-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202411'
      }
    }
  )
  log(response)
  if (response.error || !response.value) {
    throw (response.error ? response.error :response)
  }
  return 
}


