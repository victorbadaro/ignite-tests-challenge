import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

class CreateTransferController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { user_id } = request.params;
    const { amount, description } = request.body;
    const { id: sender_id } = request.user;
    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    await createTransferUseCase.execute({ user_id, sender_id, amount, description });

    return response.send();
  }
}

export { CreateTransferController };
