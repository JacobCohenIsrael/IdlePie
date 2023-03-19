import {Collection, FilterQuery, MongoClient} from "mongodb";
import * as functions from "firebase-functions";

export class MongoService {

    public static getCollection(client: MongoClient, database: Database, collectionName: string): Collection {
        switch (database) {
            case Database.app:
                return client.db(functions.config().db.app_db_name).collection(collectionName);
            case Database.configs:
                return client.db(functions.config().db.config_db_name).collection(collectionName);
        }
    }

    public static async getDocument(client: MongoClient, database: Database, collectionName: string, filterQuery: FilterQuery<any>) {
        const collection = await this.getCollection(client, database, collectionName);
        const doc = await collection.findOne(filterQuery);
        if(!doc){
            return Promise.reject("Could not find document");
        }else{
            return doc;
        }
    }


    public static async getConnection(database: Database): Promise<MongoClient> {
        return new MongoClient(functions.config().db.mongo_uri, {
            useUnifiedTopology: true
        }).connect();
    }
}

export enum Database{
    app,
    configs
}