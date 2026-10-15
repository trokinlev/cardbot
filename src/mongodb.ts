import {
  Inject,
  Injectable,
  Logger,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  type OnModuleInit,
  type Provider,
} from '@nestjs/common';
import {
  MongoClient,
  type Collection,
  type Db,
  type Document,
  type MongoClientOptions,
} from 'mongodb';

export const MONGODB_OPTIONS = 'MONGODB_OPTIONS';
export const MONGODB_CLIENT = 'MONGODB_CLIENT';
export const MONGODB_DB = 'MONGODB_DB';

export interface MongoDbModuleOptions {
  uri?: string;
  dbName?: string;
  clientOptions?: MongoClientOptions;
}

export function getCollectionToken(name: string): string {
  return `MONGODB_COLLECTION:${name}`;
}

@Injectable()
export class MongoDbProvider implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(MongoDbProvider.name);
  private readonly client: MongoClient;
  private readonly db: Db;

  constructor(@Inject(MONGODB_OPTIONS) options: MongoDbModuleOptions) {
    const uri = options.uri ?? process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MongoDB connection URI is missing. Pass it via MongoDbModule.forRoot({ uri }) or the MONGODB_URI env variable.',
      );
    }

    this.client = new MongoClient(uri, options.clientOptions);
    this.db = this.client.db(options.dbName ?? process.env.MONGODB_DB);
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log(`Connected to MongoDB database "${this.db.databaseName}"`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }

  getClient(): MongoClient {
    return this.client;
  }

  getDb(): Db {
    return this.db;
  }

  getCollection<T extends Document = Document>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}

@Module({})
export class MongoDbModule {
  static forRoot(options: MongoDbModuleOptions = {}): DynamicModule {
    return {
      global: true,
      module: MongoDbModule,
      providers: [
        { provide: MONGODB_OPTIONS, useValue: options },
        MongoDbProvider,
        {
          provide: MONGODB_CLIENT,
          useFactory: (provider: MongoDbProvider) => provider.getClient(),
          inject: [MongoDbProvider],
        },
        {
          provide: MONGODB_DB,
          useFactory: (provider: MongoDbProvider) => provider.getDb(),
          inject: [MongoDbProvider],
        },
      ],
      exports: [MongoDbProvider, MONGODB_CLIENT, MONGODB_DB],
    };
  }

  static forFeature(...names: string[]): DynamicModule {
    const providers: Provider[] = names.map((name) => ({
      provide: getCollectionToken(name),
      useFactory: (provider: MongoDbProvider) => provider.getCollection(name),
      inject: [MongoDbProvider],
    }));

    return {
      module: MongoDbModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Injects a MongoDB collection into a class property or constructor parameter.
 *
 * The collection must be registered with `MongoDbModule.forFeature('name')`.
 */
export function InjectCollection(name: string): ReturnType<typeof Inject> {
  return Inject(getCollectionToken(name));
}
