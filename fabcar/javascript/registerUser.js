/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'basic-network', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const users = ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8", "user9", "user10"];

async function main() {
    for (let i = 0; i < users.length; i++) {

        try {

            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(users[i]);
            if (userExists) {
                console.log(`An identity for the user ${users[i]} already exists in the wallet`);
                continue;
            }

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists('admin');
            if (!adminExists) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, {wallet, identity: 'admin', discovery: {enabled: false}});

            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();

            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: users[i],
                role: 'client'
            }, adminIdentity);
            const enrollment = await ca.enroll({enrollmentID: users[i], enrollmentSecret: secret});
            const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
            wallet.import(users[i], userIdentity);
            console.log(`Successfully registered and enrolled admin user ${users[i]} and imported it into the wallet`);

        } catch (error) {
            console.error(`Failed to register user ${users[i]}: ${error}`);
            process.exit(1);
        }
    }
}

main();
