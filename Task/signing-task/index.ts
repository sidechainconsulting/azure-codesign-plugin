import path = require('path');
import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import os = require('os');


const authUrl: string | undefined = tl.getInput('authurl', true);
const hsmUrl: string | undefined = tl.getInput('hsmurl', true);
const username: string | undefined = tl.getInput('username', true);
const password: string | undefined = tl.getInput('password', true);

let filesPattern: string | undefined = tl.getInput('files', false);
let filesPath: string | undefined = tl.getInput('filespath', true);

let timestampServer: string | undefined = tl.getInput('timestampserver', false);
let timestampAlgo: string | undefined = tl.getInput('timestampalgo', false);

let appendSignature: string | undefined = tl.getInput('appendsignature', false);
let subjectName: string | undefined = tl.getInput('subjectname', false);

let additionalArgs: string | undefined = tl.getInput('additionalargs', false);



// Signtool
let signtoolLocation: string;

// CSP Config
let cspconfigLocation: string;



function getSigntoolLocation(): string {

    if (!signtoolLocation) {
        console.log('Try to resolve preinstalled signtool path');
        signtoolLocation = tl.which('signtool', true);
    }

    return signtoolLocation;

}

function getCSPConfigLocation(): string {

    if (!cspconfigLocation) {
        console.log('Try to resolve preinstalled cspconfig path');
        cspconfigLocation = tl.which('cspconfig', true);
    }

    return cspconfigLocation;

}

function invokeSigntool(fn:string) {
    tl.checkPath(fn, 'file to sign');

    var st = tl.tool(getSigntoolLocation());
    st.arg('sign');
    st.arg('/v');

    if (timestampServer !== undefined) {
        st.arg('/tr');
        st.arg(timestampServer);
        if (timestampAlgo !== undefined) {
            st.arg('/td');
            st.arg(timestampAlgo);
        }
        else {
            failTask("Missing timestamp algorithm. Algo must be supplied if using timestamp server.");
        }
    }

    if (appendSignature !== undefined) {
        st.arg('/as');
    }

    if (subjectName !== undefined) {
        st.arg('/n');
        st.arg(subjectName);
    }

    if (additionalArgs !== undefined) {
        st.arg(additionalArgs);
    }

    st.arg(fn);

    return handleExecResult(st.execSync());
}

function invokeCSPGetGrant(authUrl:string | undefined, hsmUrl:string | undefined, username:string | undefined, password:string | undefined) {
    var cspConfig = tl.tool(getCSPConfigLocation());
    cspConfig.arg('getgrant');
    cspConfig.line('-authurl ' + authUrl + ' -hsmurl ' + hsmUrl + ' -username ' + username + ' -password ' + password + ' -force');


    return handleExecResult(cspConfig.execSync());
}

function invokeCSPSync() {
    var cspConfigsync = tl.tool(getCSPConfigLocation());
    cspConfigsync.arg('sync');
    //cspConfigsync.arg('-machine');

    return handleExecResult(cspConfigsync.execSync()); 
}

function invokeCSPListObjects() {
    var cspConfigsync = tl.tool(getCSPConfigLocation());
    cspConfigsync.arg('listobjects');
    //cspConfigsync.arg('-machine');

    return handleExecResult(cspConfigsync.execSync()); 
}

function revokeCSPGrant() {
    var revokeCSPGrant = tl.tool(getCSPConfigLocation());
    revokeCSPGrant.arg('revokegrant');
    revokeCSPGrant.arg('-force');
    //revokeCSPGrant.arg('-machine');

    return handleExecResult(revokeCSPGrant.execSync()); 
}

function handleExecResult(execResult: tr.IExecSyncResult) {
    if (execResult.code != tl.TaskResult.Succeeded) {
        // console.log('execResult: ' + JSON.stringify(execResult));
        failTask(tl.loc('Failed', execResult.code, execResult.stdout, execResult.stderr, execResult.error));
    }
}

function failTask(message: string) {
    throw new FailTaskError(message);
}

export class FailTaskError extends Error {

}

async function run() {
    console.log('starting...');
    try {

        // revokeCSPGrant();
        console.log('invoking cspgetgrant...');
        console.log('By Sidechain Security');
        invokeCSPGetGrant(authUrl, hsmUrl, username, password);
        invokeCSPListObjects();
        // invokeCSPSync();

        
        if (filesPath !== undefined) {
            if (filesPattern === undefined) {
                filesPattern = "*";
            }

            let filesToSign: string[] = tl.findMatch(filesPath, filesPattern);tl

            if (!filesToSign || filesToSign.length === 0) {
                throw tl.loc('NoMatchingFiles', filesPattern);
            }

            for (let file of filesToSign) {
                await invokeSigntool(file);
            }
        }
        
        revokeCSPGrant();


    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();