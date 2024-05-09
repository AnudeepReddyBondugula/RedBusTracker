import { Request, Response } from "express";
import validateEmail from "../../validators/emailValidator";
import validatePassword from "../../validators/passwordValidator";
import { ResponsePayload } from "../../types/types";
import { generateToken, getUser } from "../../utils/helper";
import User from "../../models/User";
import BadRequestError from "../../Errors/BadRequestError";
import EnvVariableError from "../../Errors/EnvVariableError";
import UnauthorizedError from "../../Errors/UnauthorizedError";
/**
 * @param req - Request object
 * @param res - Response object
 * @returns - Response object with Jwt token on sucess else returns Response error object
 */
export default async function signinController(req : Request, res : Response){
    try{
        const {email, password, fullName} = req.body;
        if (!email || !password || !fullName) {
            throw new BadRequestError("Email or password or Name must be provided");
        }
        // * Validate the email and password format
        if (!validateEmail(email) || !validatePassword(password)) {
            throw new BadRequestError("Invalid email or password or Name");
        }

        // * See if users exists or not
        let user = await getUser({email});

        // * User already exists, return unauthorized
        if (user != null) {
            throw new UnauthorizedError("Unauthorized: User already exists"); 
        }

        if(process.env.SECRET == null) {
            throw new EnvVariableError("SECRET");
        }

        // * Create a new user
        user = await User.create({email, fullName, password});
        const token = generateToken({
            userId : user.id,
            email: user.email
        }, process.env.SECRET, '1d');

        const responseData : ResponsePayload<string> = {
            success: true,
            data: token
        }
        res.status(200).json(responseData);

    }

    catch (err : any) {
        const responseData : ResponsePayload<null> = {
            success: false,
            data: null
        }
        if (err instanceof UnauthorizedError) {
            responseData.message = err.message;
            res.status(401).json(responseData);
        }
        else if (err instanceof BadRequestError) {
            responseData.message = err.message;
            res.status(400).json(responseData);
        }
        else{
            console.error(err.message);
            responseData.message = "Internal Server Error"
            res.status(500).json(responseData);
        }
    }

    
}