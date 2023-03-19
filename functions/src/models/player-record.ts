import { CurrencyRecord } from './currencies-record';
import { PlayerHeroRecord } from './player-hero-record';

export interface PlayerRecord {
    uid: string;
    goldCurrency: CurrencyRecord;
    lastGoldCollectedAt?: Date;
    heroes: Record<string, PlayerHeroRecord>

}