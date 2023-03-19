import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { SignIn } from './functions/sign-in/sign-in';
import { CollectGold } from './functions/collect-gold/collect-gold';
import { CollectRandomHero } from './functions/collect-random-hero/collect-random-hero';
import { Attack } from './functions/attack/attack';

dotenv.config();
admin.initializeApp();

export const signIn = functions.https.onCall(async (data, context) => {
    return SignIn.run(context.auth!.uid);
});

export const collectGold = functions.https.onCall(async (data, context) => {
    return CollectGold.run(context.auth!.uid);
});

export const collectRandomHero = functions.https.onCall(async (data, context) => {
    return CollectRandomHero.run(context.auth!.uid);
});

export const attack = functions.https.onCall(async (data, context) => {
    return Attack.run(context.auth!.uid, data.rivalUid!);
});

exports.client = {signIn, collectGold, collectRandomHero, attack};