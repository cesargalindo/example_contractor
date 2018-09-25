/**
 * Code was taken from:
 * https://forums.meteor.com/t/can-meteor-create-ios-app-that-takes-pictures-and-uploads-them-to-a-server/14489/2
 * 
 * Helper function for dataURI to File converter split into 2 steps for modularity reasons.
 * The main function dataURItoFile call to other functions:
 * step 1 - convert from dataURI to blob.
 * step 2 - convert from blob to file
 * 
 * @returns {Blob}
 */
CCMeteorCamera.dataURItoFile = function (dataURI, fileName) {
    var blob = CCMeteorCamera.dataURItoBlob(dataURI);
    var file = CCMeteorCamera.blobToFile(blob, fileName);
    return file;
}


/**
 * Convert dataURI to Blob 
 */
CCMeteorCamera.dataURItoBlob = function (dataURI) {
    var byteString = '';
    output = dataURI.split(',')[1];

    if (output == undefined) {
        // iOS camera most likely chopped off "data:image/jpeg;base64,"
        byteString = atob(dataURI);
    }
    else {
        byteString = atob(output);
    }

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: 'image/jpeg' });
}

/**
 * blobToFile which does the minimum required to turn the blob to a proper file object:
 */ 
CCMeteorCamera.blobToFile = function (blob, fileName) {
    blob.lastModifiedDate = new Date();
    blob.name = fileName;
    return blob;
}