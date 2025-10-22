export class TopicFavoriteStatusManager {
    private static instance: TopicFavoriteStatusManager;
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null;

    private constructor() {
        this.dbName = "SynthosDB_FavoriteTopics";
        this.storeName = "FavoriteTopics";
        this.db = null;
    }

    static getInstance(): TopicFavoriteStatusManager {
        if (!TopicFavoriteStatusManager.instance) {
            TopicFavoriteStatusManager.instance = new TopicFavoriteStatusManager();
        }

        return TopicFavoriteStatusManager.instance;
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 使用版本2以确保与已有的数据库兼容
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error("Failed to open IndexedDB for favorite status manager");
                reject(new Error("Failed to open IndexedDB"));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = event => {
                const db = request.result;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: "topicId" });

                    store.createIndex("isFavorite", "isFavorite", { unique: false });
                }
            };
        });
    }

    async getAllFavoriteStatus(): Promise<Record<string, boolean>> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized"));

                return;
            }

            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const result: Record<string, boolean> = {};

                request.result.forEach(record => {
                    result[record.topicId] = record.isFavorite;
                });
                resolve(result);
            };

            request.onerror = () => {
                console.error("Failed to get all favorite status");
                reject(new Error("Failed to get all favorite status"));
            };
        });
    }

    async markAsFavorite(topicId: string): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized"));

                return;
            }

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);

            const request = store.put({ topicId, isFavorite: true });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error(`Failed to mark topic ${topicId} as favorite`);
                reject(new Error(`Failed to mark topic ${topicId} as favorite`));
            };
        });
    }

    async removeFromFavorites(topicId: string): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized"));

                return;
            }

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);

            const request = store.delete(topicId);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error(`Failed to remove topic ${topicId} from favorites`);
                reject(new Error(`Failed to remove topic ${topicId} from favorites`));
            };
        });
    }

    async isTopicFavorite(topicId: string): Promise<boolean> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized"));

                return;
            }

            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(topicId);

            request.onsuccess = () => {
                resolve(request.result ? request.result.isFavorite : false);
            };

            request.onerror = () => {
                console.error(`Failed to check favorite status for topic ${topicId}`);
                reject(new Error(`Failed to check favorite status for topic ${topicId}`));
            };
        });
    }
}

export default TopicFavoriteStatusManager;
