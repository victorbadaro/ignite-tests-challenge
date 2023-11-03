import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe('Create User', () => {
  beforeEach(()=> {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it('Should be able to create a new user', async () => {
    const user = await createUserUseCase.execute({
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    });

    expect(user).toHaveProperty('id');
  });

  it('Should not be able to create a new user with the same email', () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: 'User Test',
        email: 'user.test@email.com',
        password: '1234'
      });
      await createUserUseCase.execute({
        name: 'Second User Test',
        email: 'user.test@email.com',
        password: '12345'
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
