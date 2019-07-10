import { getRepository, Repository } from 'typeorm';
import { BmrServer } from '../entity/BmrServer';
import { BmrUser } from '../entity/BmrUser';
import { logger } from '../logger';

/**
 * Controller for User Data
 */
export class BmrUserController {
    private static controllerInstance: BmrUserController;
    private constructor() { }
    public static GET_INSTANCE(): BmrUserController {
        if (BmrUserController.controllerInstance === undefined) {
            BmrUserController.controllerInstance = new BmrUserController();
        }

        return BmrUserController.controllerInstance;
    }
    public async addUserIfNotPresent(bmrUser: BmrUser): Promise<number> {
        let persistedBmrUser: BmrUser;
        try {
            const userRepository: Repository<BmrUser> = getRepository(BmrUser);
            if (await this.doesTheUserExist(bmrUser) === true && bmrUser.id !== undefined) {
                return bmrUser.id;
            } else {
                persistedBmrUser = await userRepository.save(bmrUser);
                logger.info(`user after saving: id - ${persistedBmrUser.id}`);

                return <number>persistedBmrUser.id;
            }
        } catch (error) {
            logger.error(<Error>error);
        }

        return -1;
    }

    public async doesTheUserExist(bmrUser: BmrUser): Promise<boolean> {
        try {
            const foundUser: BmrUser | undefined = await getRepository(BmrUser)
                .findOne(bmrUser);
            if (foundUser === undefined) {
                logger.info(`user doesn't exist.`);

                return false;
            } else {
                logger.info(`user already exists - ${JSON.stringify(foundUser)}`);
                bmrUser.createdAt = foundUser.createdAt;
                bmrUser.servers = foundUser.servers;
                bmrUser.id = foundUser.id;

                return true;
            }
        } catch (error) {
            throw error;
        }
    }

    public async getServersOfUser(user: BmrUser): Promise<BmrServer[]> {
        return getRepository(BmrServer)
            .find({ user: user });
    }
}
