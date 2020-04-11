/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const {
    Contract
} = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

class FabChat extends Contract {

    async initLedger(ctx) {
        console.log('============= START : Initialize Ledger ===========');

        const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
        if (!dataAsBytes || dataAsBytes.length === 0) {
            console.log(`Users list does not exist!`);

            const userList = [];
            const numMsgs = 0;
            const data = {
                userList,
                numMsgs,
            };

            await ctx.stub.putState("0".toString(), Buffer.from(JSON.stringify(data)));
            console.log(`Created an empty users list with key 0`);
        } else {
            console.log(`User list found!`);
        }
        console.log('============= END : Initialize Ledger ===========');
    }

    async createMsg(ctx, msgText, emailID) {
        console.log('============= START : createMsg ===========');

        let cid = new ClientIdentity(ctx.stub);
        const userID = cid.getID();

        console.log(`msgText : ${msgText}`);
        console.log(`userID  : ${userID}`);
        console.log(`emailID : ${emailID}`);

        if (msgText === "$HELLO$") {
            console.log(`Received user registration request!`);
            const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
            const data = JSON.parse(dataAsBytes.toString());

            // if new user, add user to DB
            if (!(data.userList.includes(userID))) {
                data.userList.push(userID);
                await ctx.stub.putState("0".toString(), Buffer.from(JSON.stringify(data)));
                console.log(`New user! Added user to DB`);
            } else {
                throw new Error(`User already registered!`);
            }

        } else {

            const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
            const data = JSON.parse(dataAsBytes.toString());

            // check if user is in DB
            if (!(data.userList.includes(userID))) {
                throw new Error(`User not registered! Post a $HELLO$ message to register`);
            }

            const flaggers = [];
            const flag = 0;

            const msg = {
                msgText,
                userID,
                flag,
                flaggers,
                emailID,
            };

            // increment numMsgs by 1
            data.numMsgs += 1;

            // post msg with key numMsgs
            await ctx.stub.putState((data.numMsgs).toString(), Buffer.from(JSON.stringify(msg)));
            // update data
            await ctx.stub.putState("0".toString(), Buffer.from(JSON.stringify(data)));
            console.log(`Message posted successfully with key ${data.numMsgs} !`);
        }

        console.log('============= END : createMsg ===========');
    }

    async queryMsg(ctx, msgID) {
        console.log('============= START : queryMsgByID ===========');

        let cid = new ClientIdentity(ctx.stub);
        const userID = cid.getID();

        console.log(`msgID: ${msgID}`);
        console.log(`userID  : ${userID}`);

        const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
        const data = JSON.parse(dataAsBytes.toString());

        // check if user is in DB
        if (!(data.userList.includes(userID))) {
            throw new Error(`User not registered! Post a $HELLO$ message to register`);
        }

        const msgAsBytes = await ctx.stub.getState(msgID); // get the msg from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0 || msgID < 1) {
            throw new Error(`msgID ${msgID} does not exist`);
        }

        let msg;
        msg = JSON.parse(msgAsBytes.toString());

        // don't show email ID if flag is not -1
        if (msg.flag !== -1) {
            delete msg.emailID;
        }

        // no need to show these fields anyway
        delete msg.flag;
        delete msg.flaggers;
        delete msg.userID;

        console.log(msg);
        console.log('============= END : queryMsgByID ===========');
        return JSON.stringify(msg);
    }


    async queryAllMsgs(ctx) {
        console.log('============= START : queryAllMsgs ===========');

        let cid = new ClientIdentity(ctx.stub);
        const userID = cid.getID();

        console.log(`userID  : ${userID}`);

        const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
        const data = JSON.parse(dataAsBytes.toString());

        // check if user is in DB
        if (!(data.userList.includes(userID))) {
            throw new Error(`User not registered! Post a $HELLO$ message to register`);
        }

        const startKey = '1';
        const endKey = '99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                // console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let msg;

                try {
                    msg = JSON.parse(res.value.value.toString('utf8'));

                    // don't show email ID if flag is not -1
                    if (msg.flag !== -1) {
                        delete msg.emailID;
                    }

                    // no need to show these fields anyway
                    delete msg.userID;
                    delete msg.flag;
                    delete msg.flaggers;

                } catch (err) {
                    console.log(err);
                    msg = res.value.value.toString('utf8');
                }

                allResults.push({
                    Key,
                    msg
                });
            }

            if (res.done) {
                await iterator.close();
                console.log(allResults);
                console.log('============= END : queryAllMsgs ===========');
                return JSON.stringify(allResults);
            }
        }
    }

    async flagMsg(ctx, msgID) {
        console.log('============= START : flagMsg ===========');

        let cid = new ClientIdentity(ctx.stub);
        const flagger = cid.getID();

        console.log(`msgID: ${msgID}`);
        console.log(`flagger: ${flagger}`);

        const dataAsBytes = await ctx.stub.getState("0"); // get the users data from chaincode state
        const data = JSON.parse(dataAsBytes.toString());

        // check if flagger is in DB
        if (!(data.userList.includes(flagger))) {
            throw new Error(`User not registered! Post a $HELLO$ message to register`);
        }

        const threshold = Math.ceil(0.5 * data.userList.length);

        console.log(`numUsers: ${data.userList.length}`);
        console.log(`threshold: ${threshold}`);

        const msgAsBytes = await ctx.stub.getState(msgID); // get the msg from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0 || msgID < 1) {
            throw new Error(`msgID ${msgID} does not exist`);
        }
        const msg = JSON.parse(msgAsBytes.toString());

        /* flag only if:
			1. flagger is not trying to flag its own msg
			2. flagger has not already flagged the msg
\			3. flagger is not trying to flag a msg with flag = -1
        */

        if ((flagger !== msg.userID) && !(msg.flaggers.includes(flagger)) && (msg.flag !== -1)) {

            // push new flagger in flaggers array
            msg.flaggers.push(flagger);
            // increment flag
            msg.flag += 1;

            console.log(`msgID ${msgID} flagged successfully!`);

            // if flag count reaches threshold, set flag = -1
            if (msg.flag >= threshold) {
                msg.flag = -1;
                console.log(`msgID ${msgID} flag count has now reached threshold!`);
            }

        } else {
            throw new Error(`Cannot flag message!`);
        }

        await ctx.stub.putState(msgID, Buffer.from(JSON.stringify(msg)));
        console.log('============= END : flagMsg ===========');
    }

}

module.exports = FabChat;