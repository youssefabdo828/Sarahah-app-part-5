import envConfig from "../../Config/env.config.js";
import UserRepository from "../../DB/Repositories/user.repository.js";
import { ConflictException, NotFoundException } from "../../Utils/Errors/exception.error.js";
import { decrypt } from "../../Utils/Security/encryption.security.js";
const userRepo = new UserRepository();

export const getUserProfile = async (user) => {
  if (user.phoneNumber) user.phoneNumber = decrypt(user.phoneNumber);
  return user;
};

export const getAllUsers = () => {
  return userRepo.findAllDocument(
    {},
    {
      select: "firstName lastName",
      sort: { firstName: -1 },
      limit: 10,
      skip: 1,
    }
  );
};

export const updateUserProfile = async (userId, body) => {
  const { firstName, lastName, email, gender, age } = body;

  const user = await userRepo.findDocumentById(userId);
  if (!user) {
    throw new NotFoundException("User not found", { userId }, "USER_NOT_FOUND");
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;

  if (email && email !== user.email) {
    const existingUser = await userRepo.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException(
        "User with this email already exists",
        { duplicatedEmail: email },
        "EMAIL_CONFLICT"
      );
    }
    user.email = email;
  }

  if (gender !== undefined) user.gender = gender;
  if (age !== undefined) user.age = age;

  return user.save();
};

export const deleteProfile = async (userId) => {
  const deletedUser = await userRepo.findByIdAndDeleteDocument(userId);
  if (!deletedUser) {
    throw new NotFoundException("User not found", { userId }, "USER_NOT_FOUND");
  }

  return deletedUser;
};


export const uploadProfilePicture = async (file,user) =>{
  return userRepo.updateDocumentById(user._id, {profileImage:file.path}, {new:true})
}