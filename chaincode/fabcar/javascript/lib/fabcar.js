/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');

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

    async queryCar(ctx, carNumber) {
        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
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


    async createMsg(ctx, msgNumber, msgText, owner) {
        console.info('============= START : Create msg ===========');

        const flag = 0;
        const msg = {
            msgText,
            owner,
            flag,
        };

        await ctx.stub.putState(msgNumber, Buffer.from(JSON.stringify(msg)));
        console.info('============= END : Create msg ===========');
    }

    async queryAllMsgs(ctx) {
        const startKey = 'MSG0';
        const endKey = 'MSG999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
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
            msg.owner = flagger;
        } else {
            throw new Error(`Cannot flag own message!`);
        }
        await ctx.stub.putState(msgNumber, Buffer.from(JSON.stringify(msg)));
        console.info('============= END : flagMsg ===========');
    }

}

module.exports = FabCar;
