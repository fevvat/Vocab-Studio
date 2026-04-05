const globalAny: any = global;

export class Mutex {
  private queue: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const nextQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousQueue = this.queue;
    this.queue = previousQueue.then(() => nextQueue).catch(() => nextQueue);

    await previousQueue;
    return release!;
  }
}

if (!globalAny.dbMutex) {
  globalAny.dbMutex = new Mutex();
}

export const dbMutex: Mutex = globalAny.dbMutex;
