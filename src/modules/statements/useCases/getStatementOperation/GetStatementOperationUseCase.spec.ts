import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe('Get Statement Operation', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it('Should be able to show a specific statement from a specific user', async () => {
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
      type: OperationType.DEPOSIT
    };
    const createdStatement = await inMemoryStatementsRepository.create(statementData);

    const statement = await getStatementOperationUseCase.execute({
      user_id: user.id,
      statement_id: createdStatement.id
    });

    expect(statement).toHaveProperty('id');
    expect(statement.user_id).toBe(user.id);
    expect(statement.description).toBe(statementData.description);
    expect(statement.amount).toBe(statementData.amount);
    expect(statement.type).toBe(statementData.type);
  });

  it('Should not be able to show a specific statement from a nonexistent user', async () => {
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
      type: OperationType.DEPOSIT
    };
    const statement = await inMemoryStatementsRepository.create(statementData);

    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: 'nonexistentUserId',
        statement_id: statement.id
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it('Should not be able to show a nonexistent statement', async () => {
    const userData: ICreateUserDTO = {
      name: 'User Test',
      email: 'user.test@email.com',
      password: '1234'
    };
    const user = await inMemoryUsersRepository.create(userData);

    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: user.id,
        statement_id: 'nonexistentStatementId'
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
});
