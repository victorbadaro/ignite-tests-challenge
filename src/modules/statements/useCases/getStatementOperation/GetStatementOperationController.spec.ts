import { hash } from "bcryptjs";
import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { app } from "../../../../app";
import createConnection from '../../../../database';
import { GetStatementOperationError } from "./GetStatementOperationError";

let connection: Connection;
const name = 'User Test';
const email = 'user.test@email.com';
const password = '1234';

describe('Get Statement Operation Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const hashedPassword = await hash(password, 8);

    await connection.query(`
      INSERT INTO users (id, name, email, password)
      VALUES ('${uuidV4()}', '${name}', '${email}', '${hashedPassword}')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('Should be able to show a specific statement', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const amount = 10;
    const description = 'first deposit statement';
    const createStatementResponse = await request(app).post('/api/v1/statements/deposit').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });
    const { id: statement_id } = createStatementResponse.body;
    const response = await request(app).get(`/api/v1/statements/${statement_id}`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('amount');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.id).toMatch(createStatementResponse.body.id);
    expect(response.body.amount).toBe(String(amount.toFixed(2)));
    expect(response.body.description).toMatch(description);
    expect(response.body.type).toMatch('deposit');
  });

  it('Should not be able to show a nonexistent statement', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const response = await request(app).get(`/api/v1/statements/${uuidV4()}`).set({
      Authorization: `Bearer ${token}`
    });
    const expectedResponse = new GetStatementOperationError.StatementNotFound();

    expect(response.status).toBe(expectedResponse.statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toEqual({ message: expectedResponse.message });
  });

  it('Should not be able to show a specific statement from a nonexistent user', async () => {
    const authenticationResponse = await request(app).post('/api/v1/sessions').send({ email, password });
    const { token } = authenticationResponse.body;
    const amount = 10;
    const description = 'first deposit statement';
    const createStatementResponse = await request(app).post('/api/v1/statements/deposit').send({
      amount,
      description
    }).set({
      Authorization: `Bearer ${token}`
    });

    await connection.query(`DELETE FROM users WHERE email = '${email}'`);

    const { id: statement_id } = createStatementResponse.body;
    const response = await request(app).get(`/api/v1/statements/${statement_id}`).set({
      Authorization: `Bearer ${token}`
    });
    const expectedResponse = new GetStatementOperationError.UserNotFound();

    expect(response.status).toBe(expectedResponse.statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toEqual({ message: expectedResponse.message });
  });
});
