import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('Authenticate User', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it('Should be able to authenticate a user', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    await createUserUseCase.execute(userData);
    const response = await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password
    });

    expect(response).toHaveProperty('token');
    expect(response.user.name).toBe(userData.name);
    expect(response.user.email).toBe(userData.email);
  });

  it('Should not be able to authenticate a nonexistent user', () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: 'user.test@email.com',
        password: '1234'
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it('Should not be able to authenticate a user with an incorrect password', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    await createUserUseCase.execute(userData);

    expect(async () => {
      await authenticateUserUseCase.execute({
        email: userData.email,
        password: 'incorrectpassword'
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
