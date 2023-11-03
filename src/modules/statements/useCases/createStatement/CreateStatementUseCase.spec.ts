import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType, Statement } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

describe('Create Statement', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it('Should be able to create a new statement', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    const user = await inMemoryUsersRepository.create(userData);
    const depositStatementData: ICreateStatementDTO = {
      user_id: user.id,
      description: 'some description',
      amount: 11,
      type: OperationType.DEPOSIT
    };
    const withdrawStatementData: ICreateStatementDTO = {
      user_id: user.id,
      description: 'some description',
      amount: 10,
      type: OperationType.WITHDRAW
    };

    await createStatementUseCase.execute(depositStatementData);
    await createStatementUseCase.execute(withdrawStatementData);

    const result = await inMemoryStatementsRepository.getUserBalance({
      user_id: user.id,
      with_statement: true
    }) as {
      statement: Statement[];
      balance: number;
    };

    expect(result).toHaveProperty('balance');
    expect(result).toHaveProperty('statement');
    expect(result.balance).toBe(depositStatementData.amount - withdrawStatementData.amount);
    expect(result.statement).toBeInstanceOf(Array);
    expect(result.statement.length).toBe(2);
  });

  it('Should not be able to create a statement with a nonexistent user', () => {
    const statementData: ICreateStatementDTO = {
      user_id: 'invalidUserId',
      description: 'some description',
      amount: 10,
      type: OperationType.DEPOSIT
    };

    expect(async () => {
      await createStatementUseCase.execute(statementData);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('Should not be able to create a withdraw statement if the balance is less than the amount of the statement', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    const user = await inMemoryUsersRepository.create(userData);
    const statementData: ICreateStatementDTO = {
      user_id: user.id,
      description: 'some description',
      amount: 11,
      type: OperationType.WITHDRAW
    };

    await inMemoryStatementsRepository.create({
      user_id: user.id,
      description: 'first deposit',
      amount: 10,
      type: OperationType.DEPOSIT
    });

    expect(async () => {
      await createStatementUseCase.execute(statementData);
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
