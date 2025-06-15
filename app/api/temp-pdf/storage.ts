// Shared temporary file storage for the temp-pdf API
class TempFileStorage {
    private static instance: TempFileStorage;
    private storage = new Map<string, { data: string; filename: string; contentType: string; expiresAt: number }>();

    private constructor() {
        // Cleanup expired files every 5 minutes
        setInterval(() => {
            const now = Date.now();
            this.storage.forEach((value, key) => {
                if (now > value.expiresAt) {
                    this.storage.delete(key);
                }
            });
        }, 5 * 60 * 1000);
    }

    public static getInstance(): TempFileStorage {
        if (!TempFileStorage.instance) {
            TempFileStorage.instance = new TempFileStorage();
        }
        return TempFileStorage.instance;
    }

    public set(key: string, value: { data: string; filename: string; contentType: string; expiresAt: number }) {
        this.storage.set(key, value);
    }

    public get(key: string) {
        return this.storage.get(key);
    }

    public delete(key: string) {
        return this.storage.delete(key);
    }

    public size() {
        return this.storage.size;
    }

    public listKeys() {
        return Array.from(this.storage.keys());
    }
}

export const tempFiles = TempFileStorage.getInstance();
