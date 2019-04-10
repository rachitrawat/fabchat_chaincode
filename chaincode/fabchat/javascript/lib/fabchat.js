/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');
let ID = -1;
let users = [];
let numUsers = 0;

class fabchat extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        const startKey = '0';
        const endKey = '999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                // console.log(res.value.value.toString('utf8'));
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                    // update users & numUsers
                    if (Record.msgText === "$HELLO$") {
                        users.push(Record.owner);
                        numUsers += 1;
                    }
                    ID += 1;
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
            }
            if (res.done) {
                await iterator.close();
                console.log(`users: ${users}`);
                console.log(`numUsers: ${numUsers}`);
                console.log(`lastMsgID: ${ID}`);
                break;
            }
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async createMsg(ctx, msgText, owner, ashokaID) {
        console.info('============= START : createMsg ===========');
        console.log(`msgText: ${msgText}`);
        console.log(`owner: ${owner}`);
        console.log(`ashokaID: ${ashokaID}`);

        const flaggers = [];
        const flag = 0;
        const msg = {
            msgText,
            owner,
            flag,
            flaggers,
            ashokaID,
        };

        // track users & numUsers
        if (!(users.includes(owner))) {
            console.log(`${owner} added to user list.`);
            users.push(owner);
            numUsers += 1;
        }

        ID += 1;

        await ctx.stub.putState(ID.toString(), Buffer.from(JSON.stringify(msg)));
        console.info('============= END : createMsg ===========');
    }

    async queryMsg(ctx, msgNumber) {
        let threshold = Math.ceil(0.5 * numUsers);
        console.info('============= START : queryMsgByID ===========');
        console.log(`numUsers: ${numUsers}`);
        console.log(`threshold: ${threshold}`);
        console.log(`msgID: ${msgNumber}`);

        const msgAsBytes = await ctx.stub.getState(msgNumber); // get the msg from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0) {
            throw new Error(`${msgNumber} does not exist`);
        }
        let Record;
        Record = JSON.parse(msgAsBytes.toString());

        //don't show registration $HELLO$ records
        if (Record.msgText === "$HELLO$") {
            throw new Error(`${msgNumber} does not exist`);
        }

        // don't show owner if flag < threshold
        if ((Record.flag < threshold) && (Record.flag !== -1)) {
            delete Record.owner;
            delete Record.ashokaID;
        } else {
            Record.owner = Record.ashokaID;
            delete Record.ashokaID;
        }
        delete Record.flag;
        delete Record.flaggers;

        console.log(Record);
        console.info('============= END : queryMsgByID ===========');
        return JSON.stringify(Record);
    }


    async queryAllMsgs(ctx) {
        let threshold = Math.ceil(0.5 * numUsers);
        console.info('============= START : queryAllMsgs ===========');
        console.log(`numUsers: ${numUsers}`);
        console.log(`threshold: ${threshold}`);

        const startKey = '0';
        const endKey = '9999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                // console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                    //don't show registration $HELLO$ records
                    if (Record.msgText === "$HELLO$") {
                        continue;
                    }
                    // don't show owner if flag < threshold
                    if ((Record.flag < threshold) && (Record.flag !== -1)) {
                        delete Record.owner;
                        delete Record.ashokaID;
                    } else {
                        Record.owner = Record.ashokaID;
                        delete Record.ashokaID;
                    }
                    delete Record.flag;
                    delete Record.flaggers;
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({Key, Record});
            }
            if (res.done) {
                await iterator.close();
                console.info(allResults);
                console.info('============= END : queryAllMsgs ===========');
                return JSON.stringify(allResults);
            }
        }
    }

    async flagMsg(ctx, msgNumber, flagger) {
        console.info('============= START : flagMsg ===========');
        let threshold = Math.ceil(0.5 * numUsers);
        console.log(`numUsers: ${numUsers}`);
        console.log(`threshold: ${threshold}`);
        console.log(`msgNumber: ${msgNumber}`);
        console.log(`flagger: ${flagger}`);
        const msgAsBytes = await ctx.stub.getState(msgNumber); // get the msg from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0) {
            throw new Error(`${msgNumber} does not exist`);
        }
        const msg = JSON.parse(msgAsBytes.toString());
        if ((!(flagger === msg.owner)) && (!(msg.flaggers.includes(flagger))) && (!(msg.msgText === "$HELLO$"))) {
            if (msg.flag !== -1) {
                msg.flag += 1;
            }
            msg.flaggers.push(flagger);
            console.log(`msgID ${msgNumber} flagged by ${flagger}`);
            if (msg.flag >= threshold) {
                msg.flag = -1;
            }
        } else {
            throw new Error(`Cannot flag message!`);
        }

        await ctx.stub.putState(msgNumber, Buffer.from(JSON.stringify(msg)));
        console.info('============= END : flagMsg ===========');
    }

}

module.exports = fabchat;
