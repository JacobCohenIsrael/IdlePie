import * as functions from "firebase-functions";
import { Database, MongoService } from "../../db/MongoService";
import { PlayerRecord } from '../../models/player-record';
import { PlayerConfigs } from '../../models/player-configs';

export class CollectGold {
    static async run(uid: string): Promise<any> {
        const appConnection = await MongoService.getConnection(Database.app);
        const configsConnection = await MongoService.getConnection(Database.configs)

        try {
            const collection = await MongoService.getCollection(appConnection, Database.app, "users");
            let player: PlayerRecord = await collection.findOne({"uid": uid});
            if (!player) {
                return {
                    error: `Player ${uid} not found`
                }
            }

            const lastCollectedAt = player.lastGoldCollectedAt ? new Date(player.lastGoldCollectedAt) : null;
            const now = new Date();
            const timeSinceLastCollection = (lastCollectedAt !== null) ? (now.getTime() - lastCollectedAt.getTime()) : null;

            const playerConfigs = await MongoService.getDocument(configsConnection, Database.configs, "configs", {id: "player_configs"}) as PlayerConfigs;

            if (timeSinceLastCollection && timeSinceLastCollection < playerConfigs.goldCollectionIntervalMS) {
                const timeLeft = playerConfigs.goldCollectionIntervalMS - timeSinceLastCollection;
                return {
                    error: `Not enough time has passed since last collection. Try again in ${timeLeft} ms`
                };
            }

            player.goldCurrency.amount += playerConfigs.goldPerCollection;
            await collection.updateOne({uid}, { $set: {"player.goldCurrency": player.goldCurrency, "player.lastGoldCollectedAt": player.lastGoldCollectedAt} });
            console.log("CollectGold done");
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