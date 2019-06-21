import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * User table
 */
@Entity()
export class BmrUser {

    @PrimaryGeneratedColumn()
    public id?: number;

    @Column({unique: true, nullable: false, update: false})
    public userName: string;

    @Column()
    @UpdateDateColumn()
    public lastLoggedInTime!: Date;

    constructor(userName: string) {
        this.userName = userName;
    }

}
