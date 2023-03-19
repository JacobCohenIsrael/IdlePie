import * as functions from "firebase-functions";
import { Database, MongoService } from "../../db/MongoService";
import { PlayerRecord } from '../../models/player-record';
import { PlayerConfigs } from '../../models/player-configs';

export class CollectRandomHero {
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

            const playerConfigs = await MongoService.getDocument(configsConnection, Database.configs, "configs", {id: "player_configs"}) as PlayerConfigs;


            let randomHeroGoldCost = playerConfigs.randomHeroGoldCost;
            if (player.goldCurrency.amount < randomHeroGoldCost) {
                return {
                    error: `Not enough gold to collect a random hero, you need at least ${randomHeroGoldCost} gold`
                }
            }

            player.goldCurrency.amount -= randomHeroGoldCost;

            // TODO: move this to configs DB
            const heroes = ['hero1', 'hero2', 'hero3', 'hero4', 'hero5', 'hero6', 'hero7', 'hero8', 'hero9', 'hero10', 'hero11', 'hero12'];
            const randomIndex = Math.floor(Math.random() * heroes.length);
            const randomHero = heroes[randomIndex];

            if (player.heroes[randomHero] === undefined) {
                player.heroes[randomHero] = {
                    heroId: randomHero,
                    collectedAmount: 1,
                    power: randomIndex //TODO: take power from config
                }
            } else {
                player.heroes[randomHero].collectedAmount++;
            }

            await collection.updateOne({uid}, { $set: {"player.goldCurrency": player.goldCurrency, "player.heroes": player.heroes} });
            console.log("CollectRandomHero done");
            return {
                randomHero,
                player
            };
        } catch (e) {
            console.error(e);
            throw new functions.https.HttpsError('internal', '');
        } finally {
            await appConnection.close();
            await configsConnection.close();
        }
    }
}