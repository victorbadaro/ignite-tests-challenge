import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { app } from '../../../../app';
import createConnection from '../../../../database';
import { GetBalanceError } from './GetBalanceError';

let connection: Connection;
const name = 'User Test';
const email = 'user.test@email.com';
const password = '1234';

describe('Get Balance Controller', () => {
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

  it('Should be able to show the balance from the logged user', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const response = await request(app).get('/api/v1/statements/balance').set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
    expect(response.body).toHaveProperty('statement');
    expect(response.body.balance).toBe(0);
    expect(response.body.statement).toBeInstanceOf(Array);
    expect(response.body.statement.length).toBe(0);
  });

  it('Should not be able to show the balance from a nonexistent user', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;

    await connection.query(`DELETE FROM users WHERE email = '${email}'`);

    const response = await request(app).get('/api/v1/statements/balance').set({
      Authorization: `Bearer ${token}`
    });
    const expectedResponse = new GetBalanceError();

    expect(response.status).toBe(expectedResponse.statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toEqual({ message: expectedResponse.message });
  });
});
