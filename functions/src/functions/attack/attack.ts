import * as functions from "firebase-functions";
import { Database, MongoService } from "../../db/MongoService";
import { PlayerConfigs } from "../../models/player-configs";
import { PlayerRecord } from "../../models/player-record";
import { PlayerHeroRecord } from '../../models/player-hero-record';

export class Attack {
    static async run(attackerUid: string, rivalUid: string): Promise<any> {
        const appConnection = await MongoService.getConnection(Database.app);
        const configsConnection = await MongoService.getConnection(Database.configs);

        try {
            const collection = await MongoService.getCollection(appConnection, Database.app, "users");

            // Get attacker's record
            let attacker: PlayerRecord = await collection.findOne({ "uid": attackerUid });
            if (!attacker) {
                return { error: `Player ${attackerUid} not found` };
            }

            // Get rival's record
            let rival: PlayerRecord = await collection.findOne({ "uid": rivalUid });
            if (!rival) {
                return { error: `Player ${rivalUid} not found` };
            }

            const playerConfigs = await MongoService.getDocument(configsConnection, Database.configs, "configs", { id: "player_configs" }) as PlayerConfigs;

            // Check if both players have enough gold
            if (attacker.goldCurrency.amount < playerConfigs.attackGoldCost) {
                return { error: `Attacker ${attackerUid} does not have enough gold to perform the attack` };
            }
            if (rival.goldCurrency.amount < playerConfigs.attackGoldCost) {
                return { error: `Rival ${rivalUid} does not have enough gold to be attacked` };
            }

            // Get player configs

            // Select the strongest lineup of each player
            const attackerLineup: PlayerHeroRecord[] = Object.values(attacker.heroes).slice(0, 6).sort((a, b) => b.power - a.power);
            const rivalLineup: PlayerHeroRecord[] = Object.values(rival.heroes).slice(0, 6).sort((a, b) => b.power - a.power);

            // Calculate the total power of each lineup
            const attackerTotalPower = attackerLineup.reduce((sum, hero) => sum + hero.power, 0);
            const rivalTotalPower = rivalLineup.reduce((sum, hero) => sum + hero.power, 0);

            // Determine the winner and update the players' gold amounts accordingly
            let winner: PlayerRecord | null, loser: PlayerRecord | null;
            if (attackerTotalPower > rivalTotalPower) {
                attacker.goldCurrency.amount += 200;
                rival.goldCurrency.amount -= 200;
                winner = attacker;
                loser = rival;
            } else if (attackerTotalPower < rivalTotalPower) {
                attacker.goldCurrency.amount -= 200;
                rival.goldCurrency.amount += 200;
                winner = rival;
                loser = attacker;
            } else {
                winner = loser = null;
            }

            // Update the players' records
            await collection.updateOne({ "uid": attackerUid }, { $set: { "goldCurrency.amount": attacker.goldCurrency.amount } });
            await collection.updateOne({ "uid": rivalUid }, { $set: { "goldCurrency.amount": rival.goldCurrency.amount } });

            console.log("Attack done");
            return { attacker, winner, loser, attackerTotalPower, rivalTotalPower };
        } catch (e) {
            console.error(e);
            throw new functions.https.HttpsError('internal', '');
        } finally {
            await appConnection.close();
            await configsConnection.close();
        }
    }
}
