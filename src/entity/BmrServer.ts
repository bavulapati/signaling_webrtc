import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServerStatus } from '../enums';
import { BmrUser } from './BmrUser';

/**
 * Server Table
 */
@Entity()
export class BmrServer {

    @PrimaryGeneratedColumn()
    public id?: number;

    @Column()
    public name: string;

    @Column({ unique: true, nullable: false, update: false })
    public serialKey: string;

    @Column()
    public status: ServerStatus;

    @ManyToOne(() => BmrUser, (bmrUser: BmrUser) => bmrUser.servers, { nullable: false })
    public user: BmrUser;

    constructor(name: string, serialKey: string, status: ServerStatus, user: BmrUser) {
        this.name = name;
        this.serialKey = serialKey;
        this.status = status;
        this.user = user;
    }

}
