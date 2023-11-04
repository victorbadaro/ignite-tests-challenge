import { hash } from "bcryptjs";
import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { app } from "../../../../app";
import createConnection from '../../../../database';
import { CreateStatementError } from "./CreateStatementError";

let connection: Connection;
const name = 'User Test';
const email = 'user.test@email.com';
const password = '1234';

describe('Create Statement Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const hashedPassword = await hash(password, 8);

    await connection.query(`
      INSERT INTO users (id, name, email, password)
      VALUES ('${id}', '${name}', '${email}', '${hashedPassword}')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('Should be able to create a deposit statement', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const amount = 10;
    const description = 'first deposit statement';
    const response = await request(app).post('/api/v1/statements/deposit').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('amount');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.amount).toBe(amount);
    expect(response.body.description).toMatch(description);
  });

  it('Should be able to create a withdraw statement', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const amount = 10;
    const description = 'first withdraw statement';
    const response = await request(app).post('/api/v1/statements/withdraw').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('amount');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.amount).toBe(amount);
    expect(response.body.description).toMatch(description);
  });

  it('Should not be able to create a withdraw statement if the user balance is less than statement amount', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const amount = 10;
    const description = 'second withdraw statement';
    const response = await request(app).post('/api/v1/statements/withdraw').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });
    const expectedResponse = new CreateStatementError.InsufficientFunds();

    expect(response.status).toBe(expectedResponse.statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toEqual({ message: expectedResponse.message });
  });

  it('Should not be able to create any statements with a nonexistent user', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;

    await connection.query(`DELETE FROM users WHERE email = '${email}'`);

    const amount = 10;
    const description = 'second deposit statement';
    const response = await request(app).post('/api/v1/statements/deposit').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });
    const expectedResponse = new CreateStatementError.UserNotFound();

    expect(response.status).toBe(expectedResponse.statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toEqual({ message: expectedResponse.message });
  });
});
