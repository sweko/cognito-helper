import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import * as fetch from 'node-fetch';

import { poolData, userDetails } from "./config";

declare global {
    namespace NodeJS {
        interface Global {
            fetch: any;
        }
    }
}

global.fetch = fetch;

// to-do: these will need to go to config

const userPool = new CognitoUserPool(poolData);

interface UserDetails {
    email: string,
    password: string;
    attributes: {
        name: string;
        value: string;
    }[]
}


const setAttributes = ({ email, password, attributes }: UserDetails) => {
    const authenticationData = {
        Username: email,
        Password: password
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
        Username: email,
        Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            cognitoUser.updateAttributes(attributes.map(a => ({ Name: a.name, Value: a.value })), (error, result) => {
                if (error) {
                    console.error("Error attribute update", error);
                } else {
                    console.log("Success", result);
                }
            })
        },
        onFailure: function (error) {
            console.error("Error logging", error);
        },
        newPasswordRequired: function (userAttributes) {
            delete userAttributes.email_verified;
            cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
                onSuccess: function (result) {
                    cognitoUser.updateAttributes(attributes.map(a => ({ Name: a.name, Value: a.value })), (error, result) => {
                        if (error) {
                            console.error("Error", error);
                        } else {
                            console.log("Success", result);
                        }
                    })
                },
                onFailure: function (error) {
                    console.error("Error", error);
                }
            });
        }
    });
}

setAttributes(userDetails);