import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let getBalanceUseCase: GetBalanceUseCase;

describe('Get Balance', () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
  });

  it('Should be able to list all the deposit and withdraws from a user', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    const user = await inMemoryUsersRepository.create(userData);

    const firstDeposit = await inMemoryStatementsRepository.create({
      user_id: user.id,
      description: 'first deposit',
      amount: 10,
      type: OperationType.DEPOSIT
    });
    const secondDeposit = await inMemoryStatementsRepository.create({
      user_id: user.id,
      description: 'second deposit',
      amount: 20,
      type: OperationType.DEPOSIT
    });
    const firstWithdraw = await inMemoryStatementsRepository.create({
      user_id: user.id,
      description: 'first withdraw',
      amount: 15,
      type: OperationType.WITHDRAW
    });

    const balance = await getBalanceUseCase.execute({ user_id: user.id });

    expect(balance).toHaveProperty('balance');
    expect(balance).toHaveProperty('statement');
    expect(balance.balance).toBe(firstDeposit.amount + secondDeposit.amount - firstWithdraw.amount);
    expect(balance.statement).toBeInstanceOf(Array);
    expect(balance.statement.length).toBe(3);
  });

  it('Should not be able to get the balance info from a nonexistent user', () => {
    expect(async () => {
      await getBalanceUseCase.execute({ user_id: 'nonexistentUserId' });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
