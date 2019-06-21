import { getRepository } from 'typeorm';
import { BmrUser } from '../entity/BmrUser';
import { logger } from '../logger';

/**
 * Controller for User Data
 */
// tslint:disable-next-line: no-unnecessary-class
export class BmrUserController {
    public static addUserIfNotPresent: (bmrUser: BmrUser) => Promise<number>
        = async (bmrUser: BmrUser): Promise<number> => {
            let persistedBmrUser: BmrUser;
            try {
                persistedBmrUser = await getRepository(BmrUser)
                    .save(bmrUser, { reload: true });
                if (persistedBmrUser.id !== undefined) {
                    return persistedBmrUser.id;
                }
            } catch (error) {
                logger.error(<Error>error);
            }

            return -1;
        }
}
