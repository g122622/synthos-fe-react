export class TopicReadStatusManager {
    private static instance: TopicReadStatusManager;
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null;

    private constructor() {
        this.dbName = "SynthosDB";
        this.storeName = "ReadTopics";
        this.db = null;
    }

    static getInstance(): TopicReadStatusManager {
        if (!TopicReadStatusManager.instance) {
            TopicReadStatusManager.instance = new TopicReadStatusManager();
        }

        return TopicReadStatusManager.instance;
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error("Failed to open IndexedDB for read status manager");
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

                    store.createIndex("isRead", "isRead", { unique: false });
                }
            };
        });
    }

    async getAllReadStatus(): Promise<Record<string, boolean>> {
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
                    result[record.topicId] = record.isRead;
                });
                resolve(result);
            };

            request.onerror = () => {
                console.error("Failed to get all read status");
                reject(new Error("Failed to get all read status"));
            };
        });
    }

    async markAsRead(topicId: string): Promise<void> {
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

            const request = store.put({ topicId, isRead: true });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error(`Failed to mark topic ${topicId} as read`);
                reject(new Error(`Failed to mark topic ${topicId} as read`));
            };
        });
    }

    async isTopicRead(topicId: string): Promise<boolean> {
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
                resolve(request.result ? request.result.isRead : false);
            };

            request.onerror = () => {
                console.error(`Failed to check read status for topic ${topicId}`);
                reject(new Error(`Failed to check read status for topic ${topicId}`));
            };
        });
    }
}

export default TopicReadStatusManager;
