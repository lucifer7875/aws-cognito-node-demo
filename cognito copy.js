const AmazonCognitoId = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');

// global.fetch = require('node-fetch');

// const poolData = {
//     UserPoolId: 'ap-south-1_6hXQX1zcC',
//     ClientId: '4hmibsr4g1a9qi673llk7jp2ei'
// };

const poolData = {
    UserPoolId: 'ap-south-1_6hXQX1zcC',
    ClientId: '4hmibsr4g1a9qi673llk7jp2ei'
};

const aws_region = "ap-south-1";

const CognitoUserPool = AmazonCognitoId.CognitoUserPool;
const userPool = new AmazonCognitoId.CognitoUserPool(poolData);

const signUp = (name, email, password, phone_number) => {
    return new Promise((result, reject) => {
        try {
            const attributeList = [];

            attributeList.push(
                new AmazonCognitoId.CognitoUserAttribute({ Name: "name", Value: name })
            );
            attributeList.push(
                new AmazonCognitoId.CognitoUserAttribute({ Name: "email", Value: email })
            )
            attributeList.push(
                new AmazonCognitoId.CognitoUserAttribute({ Name: "phone_number", Value: phone_number })
            )
            userPool.signUp(email, password, attributeList, null, (err, data) => {
                if (err) reject(err);
                else result(data)
            })
        } catch (err) {
            reject(err);
            console.log('err', err);
        }
    })
}

const verifyCode = (username, code) => {
    return new Promise((resolve, reject) => {
        const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoId.CognitoUser(userData);
        cognitoUser.confirmRegistration(code, true, (error, result) => {
            if (error) {
                console.log("55", error);
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
}

// const logIn = (name, password, totpCode, callback) => {
//     return new Promise((resolve, reject) => {
//         try {
//             const authenticationDetails = new AmazonCognitoId.AuthenticationDetails({
//                 Username: name,
//                 Password: password
//             });

//             const userData = {
//                 Username: name,
//                 Pool: userPool
//             };

//             const cognitoUser = new AmazonCognitoId.CognitoUser(userData);

//             cognitoUser.authenticateUser(authenticationDetails, {
//                 onSuccess: session => {
//                     // Tokens are available in the session object
//                     const accessToken = session.getAccessToken().getJwtToken();
//                     const idToken = session.getIdToken().getJwtToken();
//                     const refreshToken = session.getRefreshToken().getToken();

//                     // Include tokens in the response
//                     callback(null, {
//                         accessToken,
//                         idToken,
//                         refreshToken
//                     });
//                 },
//                 onFailure: err => {
//                     callback(err.message || JSON.stringify(err));
//                 },
//                 newPasswordRequired: (userAttributes, requiredAttributes) => {
//                     callback('New password required');
//                 },
//                 mfaRequired: (challengeName, challengeParameters) => {
//                     callback('MFA is required');
//                 },
//                 totpRequired: (secretCodeDeliveryDetails, challengeName) => {
//                     // Handle TOTP code requirement here
//                     if (totpCode) {
//                         cognitoUser.sendMFACode(totpCode, {
//                             onSuccess: session => {
//                                 // TOTP verification successful, continue with authentication
//                                 const accessToken = session.getAccessToken().getJwtToken();
//                                 const idToken = session.getIdToken().getJwtToken();
//                                 const refreshToken = session.getRefreshToken().getToken();

//                                 // Include tokens in the response
//                                 callback(null, {
//                                     accessToken,
//                                     idToken,
//                                     refreshToken
//                                 });
//                             },
//                             onFailure: err => {
//                                 // Error sending TOTP code
//                                 callback(err.message || JSON.stringify(err));
//                             }
//                         });
//                     } else {
//                         // TOTP code is required but not provided
//                         callback('TOTP code is required');
//                     }
//                 },
//                 mfaSetup: (challengeName, challengeParameters) => {
//                     // Implement MFA setup logic if needed
//                     // For example, prompt the user to set up MFA
//                     // Once MFA setup is complete, call callback with success or error
//                     callback(null, true); // Simulate successful MFA setup
//                 }
//             })
//         } catch (err) {
//             console.log('92', err);
//             reject(err);
//         }
//     })
// }

const logIn = (name, password, callback) => {
    return new Promise((resolve, reject) => {
        try {
            const authenticationDetails = new AmazonCognitoId.AuthenticationDetails({
                Username: name,
                Password: password
            });

            const userData = {
                Username: name,
                Pool: userPool
            };

            const cognitoUser = new AmazonCognitoId.CognitoUser(userData);

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (res) => {
                    const data = {
                        refreshToken: res.getRefreshToken().getToken(),
                        accessToken: res.getAccessToken().getJwtToken(),
                        accessTokenExpiresAt: res.getAccessToken().getExpiration(),
                        idToken: res.getIdToken().getJwtToken(),
                        idTokenExpiresAt: res.getAccessToken().getExpiration(),
                    };
                    callback(null, data);
                },
                onFailure: (err) => {
                    console.log("Authentication failed:", err);
                    let errorMessage = "Incorrect username or password.";
                    if (err.code === 'NotAuthorizedException') {
                        errorMessage = "Incorrect username or password. Please try again.";
                    }
                    callback({ error: errorMessage });
                },
                mfaRequired: () => {
                    const data = {
                        nextStep: 'MFA_AUTH',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
                totpRequired: () => {
                    const data = {
                        nextStep: 'SOFTWARE_TOKEN_MFA',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
                newPasswordRequired: () => {
                    const data = {
                        nextStep: 'NEW_PASSWORD_REQUIRED',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
                mfaSetup: () => {
                    const data = {
                        nextStep: 'MFA_SETUP',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
            });
        } catch (err) {
            console.error('Error during login:', err);
            reject(err);
        }
    });
};

const forgotPassword = (email) => {
    return new Promise((resolve, reject) => {
        const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoId.CognitoUser(userData);
        cognitoUser.forgotPassword({
            onSuccess: (data) => resolve(data),
            onFailure: (err) => reject(err)
        });
    })
}

const resetPassword = (email, newPassword, confirmationCode) => {
    return new Promise((resolve, reject) => {
        const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoId.CognitoUser(userData);
        cognitoUser.confirmPassword(confirmationCode, newPassword, {
            onSuccess: () => resolve('Password reset successful'),
            onFailure: (err) => reject(err)
        });
    });
};

const checkVerificationCode = (username, verificationCode) => {
    return new Promise((resolve, reject) => {
        const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoId.CognitoUser(userData);
        cognitoUser.confirmRegistration(verificationCode, true, (error, result) => {
            if (error) {
                console.log("55", error);
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
};

const ChangePassword = (email, oldPassword, newPassword, totpCode, callback) => {
    return new Promise((resolve, reject) => {
        try {
            const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
            const userData = {
                Username: email,
                Pool: userPool
            };


            const authenticationData = {
                Username: email,
                Password: oldPassword
            };
            const authenticationDetails = new AmazonCognitoId.AuthenticationDetails(authenticationData);

            const cognitoUser = new AmazonCognitoId.CognitoUser(userData);

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: result => {
                    cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, result);
                        }
                    });
                },
                onFailure: err => {
                    console.error('Authentication failed:', err);
                    callback(err);
                },
                totpRequired: (challengeName, challengeParameters) => {
                    // Handle TOTP challenge by sending the TOTP code
                    cognitoUser.sendMFACode(totpCode, {
                        onSuccess: session => {
                            // If TOTP verification is successful, proceed to change password
                            cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, result);
                                }
                            });
                        },
                        onFailure: err => {
                            console.error('TOTP verification failed:', err);
                            // Prompt the user to retry entering the TOTP code
                            callback({ error: 'Invalid TOTP code. Please try again.' });
                        }
                    });
                },
                mfaRequired: () => {
                    const data = {
                        nextStep: 'MFA_AUTH',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
                newPasswordRequired: () => {
                    const data = {
                        nextStep: 'NEW_PASSWORD_REQUIRED',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
                mfaSetup: () => {
                    const data = {
                        nextStep: 'MFA_SETUP',
                        loginSession: cognitoUser.Session,
                    };
                    callback(null, data);
                },
            });
        } catch (err) {
            console.log('92', err);
            reject(err);
        }
    })
}

module.exports.ChangePassword = ChangePassword;
module.exports.checkVerificationCode = checkVerificationCode;
module.exports.resetPassword = resetPassword;
module.exports.forgotPassword = forgotPassword;
module.exports.logIn = logIn;
module.exports.verifyCode = verifyCode;
module.exports.signUp = signUp;