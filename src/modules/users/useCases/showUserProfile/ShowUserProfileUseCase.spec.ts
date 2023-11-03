import { compare } from "bcryptjs";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe('Show User Profile', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
  });

  it('Should be able to show user info', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };

    await createUserUseCase.execute(userData);

    const userFromInMemoryRepository = await inMemoryUsersRepository.findByEmail(userData.email);
    const user = await showUserProfileUseCase.execute(userFromInMemoryRepository.id);

    expect(user).toHaveProperty('id');
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(await compare(userData.password, user.password)).toBe(true);
  });

  it('Should not be able to show the info from a nonexistent user', () => {
    expect(async () => {
      await showUserProfileUseCase.execute('invalid_user_id');
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
