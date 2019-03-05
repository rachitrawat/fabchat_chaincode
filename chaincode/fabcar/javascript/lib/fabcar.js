/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');
const threshold = 5;

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        // const cars = [
        //     {
        //         color: 'Black',
        //         make: 'Maruti',
        //         model: 'Suzuki',
        //         owner: 'Satoshi Nakamoto',
        //     },
        // ];
        //
        // for (let i = 0; i < cars.length; i++) {
        //     cars[i].docType = 'car';
        //     await ctx.stub.putState('CAR' + i, Buffer.from(JSON.stringify(cars[i])));
        //     console.info('Added <--> ', cars[i]);
        // }
        console.info('============= END : Initialize Ledger ===========');
    }

    // async createMsg(ctx, carNumber, make, model, color, owner) {
    //     console.info('============= START : Create Car ===========');
    //
    //     const car = {
    //         color,
    //         docType: 'car',
    //         make,
    //         model,
    //         owner,
    //     };
    //
    //     await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
    //     console.info('============= END : Create Car ===========');
    // }


    async createMsg(ctx, msgText, owner) {
        console.info('============= START : Create msg ===========');

        // Assign msgID automatically
        const startKey = '0';
        const endKey = '999';
        let i = 0;
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                i += 1;
            }
            if (res.done) {
                await iterator.close();
                break
            }
        }

        const flag = 0;
        const msg = {
            msgText,
            owner,
            flag,
        };

        await ctx.stub.putState(i.toString(), Buffer.from(JSON.stringify(msg)));
        console.info('============= END : Create msg ===========');
    }

    async queryMsg(ctx, msgNumber) {
        const msgAsBytes = await ctx.stub.getState(msgNumber); // get the msg from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0) {
            throw new Error(`${msgNumber} does not exist`);
        }
        let Record;
        Record = JSON.parse(msgAsBytes.toString());

        // don't show owner if flag < threshold
        if (Record.flag < threshold) {
            delete Record.owner;
        }

        // console.log(Record);
        return JSON.stringify(Record);
    }


    async queryAllMsgs(ctx) {
        const startKey = '0';
        const endKey = '999';

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
                    // don't show owner if flag < threshold
                    if (Record.flag < threshold) {
                        delete Record.owner;
                    }
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({Key, Record});
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async flagMsg(ctx, msgNumber, flagger) {
        console.info('============= START : flagMsg ===========');

        const msgAsBytes = await ctx.stub.getState(msgNumber); // get the car from chaincode state
        if (!msgAsBytes || msgAsBytes.length === 0) {
            throw new Error(`${msgNumber} does not exist`);
        }
        const msg = JSON.parse(msgAsBytes.toString());
        if (!(flagger === msg.owner)) {
            msg.flag += 1;
        } else {
            throw new Error(`Cannot flag own message!`);
        }
        await ctx.stub.putState(msgNumber, Buffer.from(JSON.stringify(msg)));
        console.info('============= END : flagMsg ===========');
    }

}

module.exports = FabCar;
