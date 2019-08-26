import { getRepository, Repository } from 'typeorm';
import { IConnectionQuery } from '../allowConnectionOnAuthentication';
import { BmrServer, ServerStatus } from '../entity/BmrServer';
import { BmrUser } from '../entity/BmrUser';
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

    public async addServerIfNotPresent(connectionQuery: IConnectionQuery, room: string): Promise<number> {
        const user: BmrUser = new BmrUser(connectionQuery.userName);
        const bmrServer: BmrServer
            = new BmrServer(room, room, ServerStatus.online, user);
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
            logger.error(<Error>error);
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
