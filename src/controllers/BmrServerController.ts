import { getConnection, getRepository, Repository } from 'typeorm';
import { BmrServer } from '../entity/BmrServer';
import { BmrUser } from '../entity/BmrUser';
import { ServerStatus } from '../enums';
import { IConnectionQuery } from '../interfaces';
import { logger } from '../logger';
import { BmrUserController } from './BmrUserController';

/**
 * Entity for Server table
 */
export class BmrServerController {
    private static controllerInstance: BmrServerController;
    private constructor() { }
    public static GET_INSTANCE(): BmrServerController {
        if (BmrServerController.controllerInstance === undefined) {
            BmrServerController.controllerInstance = new BmrServerController();
        }

        return BmrServerController.controllerInstance;
    }

    public async updateStatus(status: ServerStatus, serialKey: string): Promise<void> {
        try {
            await getConnection()
                .createQueryBuilder()
                .update(BmrServer)
                .set({ status })
                .where('serialKey = :id', { id: serialKey })
                .execute();
        } catch (error) {
            logger.error(`${error}`);
        }
    }

    public async checkStatus(serialKey: string): Promise<void> {
        try {
            const serverRepository: Repository<BmrServer> = getRepository(BmrServer);
            const server: BmrServer | undefined = await serverRepository.findOne({ where: { serialKey: serialKey } });
            if (server !== undefined) {
                logger.info(server);
            } else {
                logger.info('server is not found');
            }
        } catch (error) {
            logger.error(`${error}`);
        }
    }

    public async addServerIfNotPresent(connectionQuery: IConnectionQuery): Promise<number> {
        const user: BmrUser = new BmrUser(connectionQuery.userName);
        const bmrServer: BmrServer
            = new BmrServer(connectionQuery.serialKey, connectionQuery.serialKey, ServerStatus.online, user);
        let persistedBmrServer: BmrServer;
        try {
            const serverRepository: Repository<BmrServer> = getRepository(BmrServer);
            if (await this.doesTheServerExist(bmrServer) === true && bmrServer.id !== undefined) {
                return bmrServer.id;
            } else {
                await BmrUserController.GET_INSTANCE()
                    .doesTheUserExist(user);
                persistedBmrServer = await serverRepository.save(bmrServer);
                logger.info(`server after saving: - ${JSON.stringify(persistedBmrServer)}`);

                return <number>persistedBmrServer.id;
            }
        } catch (error) {
            logger.error(`${error}`);
        }

        return -1;
    }

    private async doesTheServerExist(bmrServer: BmrServer): Promise<boolean> {
        try {
            const foundServer: BmrServer | undefined = await getRepository(BmrServer)
                .findOne({ serialKey: bmrServer.serialKey });
            if (foundServer === undefined) {
                logger.info(`server doesn't exist.`);

                return false;
            } else {
                logger.info(`server already exists with id - ${foundServer.id}`);
                logger.info(`Server info: ${foundServer}`);
                bmrServer.name = foundServer.name;
                bmrServer.user = foundServer.user;
                bmrServer.status = foundServer.status;
                bmrServer.id = foundServer.id;

                return true;
            }
        } catch (error) {
            throw error;
        }

    }
}
