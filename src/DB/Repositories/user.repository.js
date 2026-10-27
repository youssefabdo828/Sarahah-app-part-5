import User from "../models/user.model.js";
import BaseRepository from "./base.repository.js";




export default class UserRepository extends BaseRepository{
    constructor(){
        super(User)
    }




    findUserByEmail(email){
        return this.findOneDocument({email})
    }
}