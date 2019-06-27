import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BmrServer } from './BmrServer';

/**
 * User table
 */
@Entity()
export class BmrUser {

    @PrimaryGeneratedColumn()
    public id?: number;

    @Column({ unique: true, nullable: false, update: false })
    public userName: string;

    @Column()
    @CreateDateColumn()
    public createdAt!: Date;

    @OneToMany(() => BmrServer, (bmrServer: BmrServer) => bmrServer.user)
    public servers!: BmrServer[];

    constructor(userName: string) {
        this.userName = userName;
    }

}
