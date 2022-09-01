"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailTaskError = void 0;
var tl = require("azure-pipelines-task-lib/task");
var authUrl = tl.getInput('authurl', true);
var hsmUrl = tl.getInput('hsmurl', true);
var username = tl.getInput('username', true);
var password = tl.getInput('password', true);
var filesPattern = tl.getInput('files', false);
var filesPath = tl.getInput('filespath', true);
var timestampServer = tl.getInput('timestampserver', false);
var timestampAlgo = tl.getInput('timestampalgo', false);
var appendSignature = tl.getInput('appendsignature', false);
var subjectName = tl.getInput('subjectname', false);
var additionalArgs = tl.getInput('additionalargs', false);
// Signtool
var signtoolLocation;
// CSP Config
var cspconfigLocation;
function getSigntoolLocation() {
    if (!signtoolLocation) {
        console.log('Try to resolve preinstalled signtool path');
        signtoolLocation = tl.which('signtool', true);
    }
    return signtoolLocation;
}
function getCSPConfigLocation() {
    if (!cspconfigLocation) {
        console.log('Try to resolve preinstalled cspconfig path');
        cspconfigLocation = tl.which('cspconfig', true);
    }
    return cspconfigLocation;
}
function invokeSigntool(fn) {
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
function invokeCSPGetGrant(authUrl, hsmUrl, username, password) {
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
function handleExecResult(execResult) {
    if (execResult.code != tl.TaskResult.Succeeded) {
        // console.log('execResult: ' + JSON.stringify(execResult));
        failTask(tl.loc('Failed', execResult.code, execResult.stdout, execResult.stderr, execResult.error));
    }
}
function failTask(message) {
    throw new FailTaskError(message);
}
var FailTaskError = /** @class */ (function (_super) {
    __extends(FailTaskError, _super);
    function FailTaskError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FailTaskError;
}(Error));
exports.FailTaskError = FailTaskError;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var filesToSign, _i, filesToSign_1, file, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('starting...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    // revokeCSPGrant();
                    console.log('invoking cspgetgrant...');
                    console.log('By Sidechain Security');
                    invokeCSPGetGrant(authUrl, hsmUrl, username, password);
                    invokeCSPListObjects();
                    if (!(filesPath !== undefined)) return [3 /*break*/, 5];
                    if (filesPattern === undefined) {
                        filesPattern = "*";
                    }
                    filesToSign = tl.findMatch(filesPath, filesPattern);
                    tl;
                    if (!filesToSign || filesToSign.length === 0) {
                        throw tl.loc('NoMatchingFiles', filesPattern);
                    }
                    _i = 0, filesToSign_1 = filesToSign;
                    _a.label = 2;
                case 2:
                    if (!(_i < filesToSign_1.length)) return [3 /*break*/, 5];
                    file = filesToSign_1[_i];
                    return [4 /*yield*/, invokeSigntool(file)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    revokeCSPGrant();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
run();
