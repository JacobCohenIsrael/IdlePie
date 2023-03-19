import * as functions from "firebase-functions";
import { SignIn } from './functions/sign-in/sign-in';

// Just an idea
export class FunctionMapper {
    public async execute(data: any, context: any): Promise<any> {

        const uid = context.auth?.uid;
        if (!uid) {
            console.error("unauthenticated")
            throw new functions.https.HttpsError('unauthenticated', '');
        }
        console.log("data:" + data);
        switch (data.functionName) {
            case "sign-in":
                return SignIn.run(uid);
            default:
                return Promise.reject("no function found");
        }
    }
}
