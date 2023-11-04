import { hash } from 'bcryptjs';
import request from 'supertest';
import { Connection } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import { app } from '../../../../app';
import createConnection from '../../../../database';
import { IncorrectEmailOrPasswordError } from './IncorrectEmailOrPasswordError';

let connection: Connection;
const name = 'User Test';
const email = 'user.test@email.com';
const password = '1234';

describe('Authenticate User Controller', () => {
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

  it('Should be able to authenticate a user', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email,
      password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.name).toMatch(name);
    expect(response.body.user.email).toMatch(email);
  });

  it('Should not be able to authenticate user with a nonexistent user', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'nonexistent.user@email.com',
      password
    });

    const expectedResponse = new IncorrectEmailOrPasswordError();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: expectedResponse.message });
  });

  it('Should not be able to authenticate user with an incorrect password', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email,
      password: 'abcd'
    });

    const expectedResponse = new IncorrectEmailOrPasswordError();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: expectedResponse.message });
  });
});
