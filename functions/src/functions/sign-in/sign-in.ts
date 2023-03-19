import * as functions from "firebase-functions";
import { Database, MongoService } from "../../db/MongoService";
import { PlayerRecord } from '../../models/player-record';
import { PlayerConfigs } from '../../models/player-configs';
import { CurrencyType } from '../../models/currency-type.enum';
export class SignIn {
    static async run(uid: string): Promise<any> {
        const appConnection = await MongoService.getConnection(Database.app);
        const configsConnection = await MongoService.getConnection(Database.configs)

        try {
            const collection = await MongoService.getCollection(appConnection, Database.app, "users");
            let player: PlayerRecord = await collection.findOne({"uid": uid});
            if (!player) {
                const playerConfigs = await MongoService.getDocument(configsConnection, Database.configs, "configs", {id: "player_configs"}) as PlayerConfigs;

                player = {
                    uid: uid,
                    goldCurrency: {
                        currencyId: CurrencyType.Gold,
                        amount: playerConfigs.startingGold
                    },
                    heroes: {} // TODO: "init starting heroes from configs"
                }
            }
            console.log("SignIn done");
            return player;
        } catch (e) {
            console.error(e);
            throw new functions.https.HttpsError('internal', '');
        } finally {
            await appConnection.close();
            await configsConnection.close();
        }
    }

}